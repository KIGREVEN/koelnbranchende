const { query, transaction } = require('../config/database');
const Joi = require('joi');

// Validation schema for booking data
const bookingSchema = Joi.object({
  kundenname: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Kundenname ist erforderlich',
    'string.min': 'Kundenname muss mindestens 2 Zeichen lang sein',
    'string.max': 'Kundenname darf maximal 100 Zeichen lang sein'
  }),
  kundennummer: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Kundennummer ist erforderlich',
    'string.max': 'Kundennummer darf maximal 50 Zeichen lang sein'
  }),
  belegung: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Belegung (Branche) ist erforderlich',
    'string.min': 'Belegung muss mindestens 2 Zeichen lang sein',
    'string.max': 'Belegung darf maximal 100 Zeichen lang sein'
  }),
  zeitraum_von: Joi.date().iso().required().messages({
    'date.base': 'Zeitraum von muss ein gültiges Datum sein',
    'any.required': 'Zeitraum von ist erforderlich'
  }),
  zeitraum_bis: Joi.date().iso().min(Joi.ref('zeitraum_von')).required().messages({
    'date.base': 'Zeitraum bis muss ein gültiges Datum sein',
    'date.min': 'Zeitraum bis muss nach dem Startdatum liegen',
    'any.required': 'Zeitraum bis ist erforderlich'
  }),
  platzierung: Joi.number().integer().min(1).max(6).required().messages({
    'number.base': 'Platzierung muss eine Zahl sein',
    'number.integer': 'Platzierung muss eine ganze Zahl sein',
    'number.min': 'Platzierung muss zwischen 1 und 6 liegen',
    'number.max': 'Platzierung muss zwischen 1 und 6 liegen',
    'any.required': 'Platzierung ist erforderlich'
  }),
  status: Joi.string().valid('frei', 'reserviert', 'gebucht').default('reserviert').messages({
    'any.only': 'Status muss frei, reserviert oder gebucht sein'
  }),
  berater: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Berater ist erforderlich',
    'string.min': 'Berater muss mindestens 2 Zeichen lang sein',
    'string.max': 'Berater darf maximal 100 Zeichen lang sein'
  })
});

class Booking {
  // Validate booking data
  static validate(data) {
    const { error, value } = bookingSchema.validate(data, { abortEarly: false });
    if (error) {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      throw validationError;
    }
    return value;
  }

  // Check for booking conflicts
  static async checkConflict(belegung, platzierung, zeitraum_von, zeitraum_bis, excludeId = null) {
    let queryText = `
      SELECT id, kundenname, status, zeitraum_von, zeitraum_bis
      FROM bookings 
      WHERE belegung = $1 
        AND platzierung = $2 
        AND status IN ('reserviert', 'gebucht')
        AND (
          (zeitraum_von <= $3 AND zeitraum_bis > $3) OR
          (zeitraum_von < $4 AND zeitraum_bis >= $4) OR
          (zeitraum_von >= $3 AND zeitraum_bis <= $4)
        )
    `;
    
    const params = [belegung, platzierung, zeitraum_von, zeitraum_bis];
    
    if (excludeId) {
      queryText += ' AND id != $5';
      params.push(excludeId);
    }

    const result = await query(queryText, params);
    return result.rows;
  }

  // Create a new booking
  static async create(bookingData) {
    const validatedData = this.validate(bookingData);
    
    // Check for conflicts
    const conflicts = await this.checkConflict(
      validatedData.belegung,
      validatedData.platzierung,
      validatedData.zeitraum_von,
      validatedData.zeitraum_bis
    );

    if (conflicts.length > 0) {
      const error = new Error('Booking conflict detected');
      error.name = 'ConflictError';
      error.conflicts = conflicts;
      throw error;
    }

    const queryText = `
      INSERT INTO bookings (
        kundenname, kundennummer, belegung, zeitraum_von, zeitraum_bis, 
        platzierung, status, berater, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      validatedData.kundenname,
      validatedData.kundennummer,
      validatedData.belegung,
      validatedData.zeitraum_von,
      validatedData.zeitraum_bis,
      validatedData.platzierung,
      validatedData.status,
      validatedData.berater
    ];

    const result = await query(queryText, values);
    return result.rows[0];
  }

  // Get all bookings with optional filters
  static async findAll(filters = {}) {
    let queryText = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.belegung) {
      paramCount++;
      queryText += ` AND belegung ILIKE $${paramCount}`;
      params.push(`%${filters.belegung}%`);
    }

    if (filters.berater) {
      paramCount++;
      queryText += ` AND berater ILIKE $${paramCount}`;
      params.push(`%${filters.berater}%`);
    }

    if (filters.status) {
      paramCount++;
      queryText += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.platzierung) {
      paramCount++;
      queryText += ` AND platzierung = $${paramCount}`;
      params.push(filters.platzierung);
    }

    if (filters.zeitraum_von) {
      paramCount++;
      queryText += ` AND zeitraum_bis >= $${paramCount}`;
      params.push(filters.zeitraum_von);
    }

    if (filters.zeitraum_bis) {
      paramCount++;
      queryText += ` AND zeitraum_von <= $${paramCount}`;
      params.push(filters.zeitraum_bis);
    }

    queryText += ' ORDER BY zeitraum_von ASC, platzierung ASC';

    const result = await query(queryText, params);
    return result.rows;
  }

  // Get booking by ID
  static async findById(id) {
    const result = await query('SELECT * FROM bookings WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Update booking
  static async update(id, updateData) {
    const existingBooking = await this.findById(id);
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    const validatedData = this.validate({ ...existingBooking, ...updateData });

    // Check for conflicts (excluding current booking)
    const conflicts = await this.checkConflict(
      validatedData.belegung,
      validatedData.platzierung,
      validatedData.zeitraum_von,
      validatedData.zeitraum_bis,
      id
    );

    if (conflicts.length > 0) {
      const error = new Error('Booking conflict detected');
      error.name = 'ConflictError';
      error.conflicts = conflicts;
      throw error;
    }

    const queryText = `
      UPDATE bookings 
      SET kundenname = $1, kundennummer = $2, belegung = $3, zeitraum_von = $4, 
          zeitraum_bis = $5, platzierung = $6, status = $7, berater = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;

    const values = [
      validatedData.kundenname,
      validatedData.kundennummer,
      validatedData.belegung,
      validatedData.zeitraum_von,
      validatedData.zeitraum_bis,
      validatedData.platzierung,
      validatedData.status,
      validatedData.berater,
      id
    ];

    const result = await query(queryText, values);
    return result.rows[0];
  }

  // Delete booking
  static async delete(id) {
    const result = await query('DELETE FROM bookings WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Get availability for specific criteria
  static async getAvailability(belegung, platzierung, zeitraum_von, zeitraum_bis) {
    const conflicts = await this.checkConflict(belegung, platzierung, zeitraum_von, zeitraum_bis);
    
    return {
      available: conflicts.length === 0,
      conflicts: conflicts,
      status: conflicts.length === 0 ? 'frei' : 'belegt'
    };
  }

  // Clean up expired reservations (older than 30 minutes)
  static async cleanupExpiredReservations() {
    const queryText = `
      UPDATE bookings 
      SET status = 'frei', updated_at = NOW()
      WHERE status = 'reserviert' 
        AND created_at < NOW() - INTERVAL '30 minutes'
      RETURNING *
    `;
    
    const result = await query(queryText);
    return result.rows;
  }
}

module.exports = Booking;


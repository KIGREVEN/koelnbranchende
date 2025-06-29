const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// GET /api/availability/check - Check availability for specific criteria
router.get('/check', async (req, res, next) => {
  try {
    const { belegung, platzierung, zeitraum_von, zeitraum_bis } = req.query;
    
    // Validate required parameters
    if (!belegung || !platzierung || !zeitraum_von || !zeitraum_bis) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['belegung', 'platzierung', 'zeitraum_von', 'zeitraum_bis']
      });
    }

    // Validate platzierung is a number between 1-6
    const platzierungNum = parseInt(platzierung);
    if (isNaN(platzierungNum) || platzierungNum < 1 || platzierungNum > 6) {
      return res.status(400).json({
        success: false,
        error: 'Platzierung must be a number between 1 and 6'
      });
    }

    // Validate dates
    const vonDate = new Date(zeitraum_von);
    const bisDate = new Date(zeitraum_bis);
    
    if (isNaN(vonDate.getTime()) || isNaN(bisDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
      });
    }

    if (bisDate <= vonDate) {
      return res.status(400).json({
        success: false,
        error: 'zeitraum_bis must be after zeitraum_von'
      });
    }

    const availability = await Booking.getAvailability(
      belegung,
      platzierungNum,
      zeitraum_von,
      zeitraum_bis
    );

    res.json({
      success: true,
      data: {
        belegung,
        platzierung: platzierungNum,
        zeitraum_von,
        zeitraum_bis,
        ...availability
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/availability/overview - Get availability overview for a time range
router.get('/overview', async (req, res, next) => {
  try {
    const { 
      belegung, 
      zeitraum_von, 
      zeitraum_bis,
      platzierung_min = 1,
      platzierung_max = 6
    } = req.query;
    
    // Validate required parameters
    if (!zeitraum_von || !zeitraum_bis) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['zeitraum_von', 'zeitraum_bis']
      });
    }

    // Validate dates
    const vonDate = new Date(zeitraum_von);
    const bisDate = new Date(zeitraum_bis);
    
    if (isNaN(vonDate.getTime()) || isNaN(bisDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
      });
    }

    if (bisDate <= vonDate) {
      return res.status(400).json({
        success: false,
        error: 'zeitraum_bis must be after zeitraum_von'
      });
    }

    const minPlatz = parseInt(platzierung_min);
    const maxPlatz = parseInt(platzierung_max);

    if (isNaN(minPlatz) || isNaN(maxPlatz) || minPlatz < 1 || maxPlatz > 6 || minPlatz > maxPlatz) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platzierung range. Must be between 1-6 and min <= max'
      });
    }

    const overview = [];
    
    // Check availability for each placement position
    for (let platz = minPlatz; platz <= maxPlatz; platz++) {
      let availability;
      
      if (belegung) {
        // Check specific belegung
        availability = await Booking.getAvailability(
          belegung,
          platz,
          zeitraum_von,
          zeitraum_bis
        );
      } else {
        // Check all existing belegungen for this placement
        const existingBookings = await Booking.findAll({
          platzierung: platz,
          zeitraum_von,
          zeitraum_bis
        });
        
        availability = {
          available: existingBookings.length === 0,
          conflicts: existingBookings,
          status: existingBookings.length === 0 ? 'frei' : 'belegt'
        };
      }
      
      overview.push({
        platzierung: platz,
        belegung: belegung || 'alle',
        ...availability
      });
    }

    res.json({
      success: true,
      data: {
        zeitraum_von,
        zeitraum_bis,
        belegung: belegung || 'alle',
        platzierung_range: `${minPlatz}-${maxPlatz}`,
        overview
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/availability/calendar - Get calendar view of bookings
router.get('/calendar', async (req, res, next) => {
  try {
    const { 
      start_date, 
      end_date,
      belegung,
      platzierung
    } = req.query;
    
    // Validate required parameters
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['start_date', 'end_date']
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        error: 'end_date must be after start_date'
      });
    }

    // Build filters
    const filters = {
      zeitraum_von: start_date,
      zeitraum_bis: end_date
    };

    if (belegung) filters.belegung = belegung;
    if (platzierung) filters.platzierung = parseInt(platzierung);

    const bookings = await Booking.findAll(filters);
    
    // Group bookings by date and platzierung for calendar view
    const calendar = {};
    
    bookings.forEach(booking => {
      const startDate = new Date(booking.zeitraum_von).toISOString().split('T')[0];
      const endDate = new Date(booking.zeitraum_bis).toISOString().split('T')[0];
      
      if (!calendar[startDate]) {
        calendar[startDate] = {};
      }
      
      if (!calendar[startDate][booking.platzierung]) {
        calendar[startDate][booking.platzierung] = [];
      }
      
      calendar[startDate][booking.platzierung].push({
        id: booking.id,
        kundenname: booking.kundenname,
        belegung: booking.belegung,
        status: booking.status,
        berater: booking.berater,
        zeitraum_von: booking.zeitraum_von,
        zeitraum_bis: booking.zeitraum_bis
      });
    });

    res.json({
      success: true,
      data: {
        start_date,
        end_date,
        filters,
        calendar,
        total_bookings: bookings.length
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


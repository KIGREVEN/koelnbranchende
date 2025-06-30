const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// POST /api/migrate/verkaufspreis - Run verkaufspreis migration
router.post('/verkaufspreis', async (req, res) => {
  try {
    console.log('🚀 Starting verkaufspreis migration via API...');
    
    // Check if column already exists
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'verkaufspreis'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Column verkaufspreis already exists');
      return res.json({
        success: true,
        message: 'Column verkaufspreis already exists',
        alreadyExists: true
      });
    }
    
    // Add verkaufspreis column
    await query(`
      ALTER TABLE bookings 
      ADD COLUMN verkaufspreis DECIMAL(10,2) DEFAULT NULL
    `);
    
    console.log('✅ Added verkaufspreis column to bookings table');
    
    // Add comment
    await query(`
      COMMENT ON COLUMN bookings.verkaufspreis IS 'Verkaufspreis der Buchung in Euro'
    `);
    
    console.log('✅ Added comment to verkaufspreis column');
    
    // Add index (with error handling in case it already exists)
    try {
      await query(`
        CREATE INDEX idx_bookings_verkaufspreis 
        ON bookings(verkaufspreis) 
        WHERE verkaufspreis IS NOT NULL
      `);
      console.log('✅ Added index for verkaufspreis column');
    } catch (indexError) {
      if (indexError.code === '42P07') {
        console.log('ℹ️ Index already exists, skipping...');
      } else {
        throw indexError;
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
    res.json({
      success: true,
      message: 'Verkaufspreis migration completed successfully',
      steps: [
        'Added verkaufspreis column (DECIMAL(10,2))',
        'Added column comment',
        'Added performance index'
      ]
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      code: error.code
    });
  }
});

// GET /api/migrate/status - Check migration status
router.get('/status', async (req, res) => {
  try {
    // Check if verkaufspreis column exists
    const checkColumn = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'verkaufspreis'
    `);
    
    // Check if index exists
    const checkIndex = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'bookings' 
      AND indexname = 'idx_bookings_verkaufspreis'
    `);
    
    const migrationStatus = {
      verkaufspreis_column_exists: checkColumn.rows.length > 0,
      column_details: checkColumn.rows[0] || null,
      index_exists: checkIndex.rows.length > 0,
      migration_needed: checkColumn.rows.length === 0
    };
    
    res.json({
      success: true,
      status: migrationStatus
    });
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message
    });
  }
});

module.exports = router;


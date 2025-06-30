import { useState } from 'react';
import useCategories from '../hooks/useCategories';
import DatePicker from './DatePicker'; // Import der neuen DatePicker-Komponente

const BookingForm = ({ onBookingCreated }) => {
  const [formData, setFormData] = useState({
    kundenname: '',
    kundennummer: '',
    belegung: '',
    zeitraum_von: '',
    zeitraum_bis: '',
    platzierung: '1', // Standardwert statt leer
    status: 'reserviert',
    berater: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const categories = useCategories() || []; // Fallback zu leerem Array

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Spezielle Handler für DatePicker-Komponenten
  const handleDateChange = (name) => (value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Konvertiert Datum von tt.mm.jjjj zu ISO Format
  const convertDateToISO = (dateString, isEndDate = false) => {
    if (!dateString) return '';
    
    const [day, month, year] = dateString.split('.');
    const time = isEndDate ? '23:59:59' : '00:00:00';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}.000Z`;
  };

  // Validiert Datumsformat tt.mm.jjjj
  const isValidDateFormat = (dateString) => {
    const dateRegex = /^\d{1,2}\.\d{1,2}\.\d{4}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const [day, month, year] = dateString.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.kundenname.trim()) errors.push('Kundenname ist erforderlich');
    if (!formData.kundennummer.trim()) errors.push('Kundennummer ist erforderlich');
    if (!formData.belegung.trim()) errors.push('Belegung ist erforderlich');
    if (!formData.berater.trim()) errors.push('Berater ist erforderlich');
    if (!formData.platzierung) errors.push('Platzierung ist erforderlich');

    if (!formData.zeitraum_von) {
      errors.push('Startdatum ist erforderlich');
    } else if (!isValidDateFormat(formData.zeitraum_von)) {
      errors.push('Startdatum muss im Format tt.mm.jjjj eingegeben werden');
    }

    if (!formData.zeitraum_bis) {
      errors.push('Enddatum ist erforderlich');
    } else if (!isValidDateFormat(formData.zeitraum_bis)) {
      errors.push('Enddatum muss im Format tt.mm.jjjj eingegeben werden');
    }

    // Prüfe ob Enddatum nach Startdatum liegt
    if (formData.zeitraum_von && formData.zeitraum_bis && 
        isValidDateFormat(formData.zeitraum_von) && isValidDateFormat(formData.zeitraum_bis)) {
      const [startDay, startMonth, startYear] = formData.zeitraum_von.split('.').map(Number);
      const [endDay, endMonth, endYear] = formData.zeitraum_bis.split('.').map(Number);
      
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      if (endDate < startDate) {
        errors.push('Enddatum muss nach dem Startdatum liegen');
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join(', ') });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Konvertiere Daten für API
      const apiData = {
        ...formData,
        zeitraum_von: convertDateToISO(formData.zeitraum_von, false),
        zeitraum_bis: convertDateToISO(formData.zeitraum_bis, true),
        platzierung: parseInt(formData.platzierung)
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Buchung erfolgreich erstellt!' });
        if (onBookingCreated) onBookingCreated();
        
        // Formular zurücksetzen
        setFormData({
          kundenname: '',
          kundennummer: '',
          belegung: '',
          zeitraum_von: '',
          zeitraum_bis: '',
          platzierung: '1', // Zurück zum Standardwert
          status: 'reserviert',
          berater: ''
        });
      } else if (response.status === 409) {
        setMessage({
          type: 'error',
          text: 'Konflikt: Ein Termin für diese Belegung, Platzierung und Zeitraum ist bereits vorhanden!'
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Fehler beim Erstellen der Buchung' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Netzwerkfehler. Bitte versuchen Sie es erneut.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        📅 Neue Buchung erstellen
      </h2>
      <p className="text-gray-600 mb-6">Erstellen Sie eine neue Buchung für das Köln Branchen Portal</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kundenname und Kundennummer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              👤 Kundenname *
            </label>
            <input
              type="text"
              name="kundenname"
              value={formData.kundenname}
              onChange={handleInputChange}
              placeholder="Max Mustermann"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              🆔 Kundennummer *
            </label>
            <input
              type="text"
              name="kundennummer"
              value={formData.kundennummer}
              onChange={handleInputChange}
              placeholder="K-001"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Belegung/Branche */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
            🏢 Belegung/Branche *
          </label>
          <input
            type="text"
            name="belegung"
            list="belegung-list"
            value={formData.belegung}
            onChange={handleInputChange}
            placeholder="z.B. Kanalreinigung"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
          <datalist id="belegung-list">
            {Array.isArray(categories) && categories.map(cat => (
              <option key={cat.id} value={cat.name} />
            ))}
          </datalist>
        </div>

        {/* Datumsfelder mit neuer DatePicker-Komponente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              📅 Startdatum *
            </label>
            <DatePicker
              value={formData.zeitraum_von}
              onChange={handleDateChange('zeitraum_von')}
              placeholder="tt.mm.jjjj (z.B. 15.07.2024)"
              name="zeitraum_von"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Format: tt.mm.jjjj</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              📅 Enddatum *
            </label>
            <DatePicker
              value={formData.zeitraum_bis}
              onChange={handleDateChange('zeitraum_bis')}
              placeholder="tt.mm.jjjj (z.B. 20.07.2024)"
              name="zeitraum_bis"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Format: tt.mm.jjjj</p>
          </div>
        </div>

        {/* Platzierung und Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              📍 Platzierung *
            </label>
            <select
              name="platzierung"
              value={formData.platzierung}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="1">Platzierung 1</option>
              <option value="2">Platzierung 2</option>
              <option value="3">Platzierung 3</option>
              <option value="4">Platzierung 4</option>
              <option value="5">Platzierung 5</option>
              <option value="6">Platzierung 6</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              ⚠️ Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="vorreserviert">vorreserviert</option>
              <option value="reserviert">Reserviert</option>
              <option value="gebucht">Gebucht</option>
            </select>
          </div>
        </div>

        {/* Berater */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
            👨‍💼 Berater *
          </label>
          <input
            type="text"
            name="berater"
            value={formData.berater}
            onChange={handleInputChange}
            placeholder="Anna Schmidt"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Nachricht */}
        {message.text && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? '⏳ Wird erstellt...' : '✅ Buchung erstellen'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;


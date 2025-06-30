import { useState } from 'react';

const BookingForm = ({ onBookingCreated }) => {
  const [formData, setFormData] = useState({
    kundenname: '',
    kundennummer: '',
    belegung: '',
    zeitraum_von: '',
    zeitraum_bis: '',
    platzierung: '1',
    status: 'reserviert',
    berater: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Statische Kategorien als Fallback - eliminiert API-Abhängigkeit
  const staticCategories = [
    { id: 1, name: 'Gastronomie' },
    { id: 2, name: 'Einzelhandel' },
    { id: 3, name: 'Dienstleistungen' },
    { id: 4, name: 'Handwerk' },
    { id: 5, name: 'Gesundheit' },
    { id: 6, name: 'Bildung' },
    { id: 7, name: 'Immobilien' },
    { id: 8, name: 'Automotive' },
    { id: 9, name: 'IT & Technik' },
    { id: 10, name: 'Finanzdienstleistungen' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.kundenname.trim()) errors.push('Kundenname ist erforderlich');
    if (!formData.kundennummer.trim()) errors.push('Kundennummer ist erforderlich');
    if (!formData.belegung.trim()) errors.push('Belegung ist erforderlich');
    if (!formData.zeitraum_von.trim()) errors.push('Startdatum ist erforderlich');
    if (!formData.zeitraum_bis.trim()) errors.push('Enddatum ist erforderlich');
    if (!formData.berater.trim()) errors.push('Berater ist erforderlich');

    // Datumsvalidierung
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (formData.zeitraum_von && !dateRegex.test(formData.zeitraum_von)) {
      errors.push('Startdatum muss im Format tt.mm.jjjj sein');
    }
    if (formData.zeitraum_bis && !dateRegex.test(formData.zeitraum_bis)) {
      errors.push('Enddatum muss im Format tt.mm.jjjj sein');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setMessage({ 
        type: 'error', 
        text: 'Bitte korrigieren Sie folgende Fehler: ' + errors.join(', ') 
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // API-URL mit Fallback
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://koeln-branchen-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Buchung erfolgreich erstellt!' 
        });
        
        // Form zurücksetzen
        setFormData({
          kundenname: '',
          kundennummer: '',
          belegung: '',
          zeitraum_von: '',
          zeitraum_bis: '',
          platzierung: '1',
          status: 'reserviert',
          berater: ''
        });

        // Parent-Komponente benachrichtigen
        if (onBookingCreated) {
          onBookingCreated(data.data);
        }
      } else {
        throw new Error(data.message || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Buchung:', error);
      setMessage({ 
        type: 'error', 
        text: 'Fehler beim Erstellen der Buchung: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        📝 Neue Buchung erstellen
      </h2>

      {message.text && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Max Mustermann"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              🔢 Kundennummer *
            </label>
            <input
              type="text"
              name="kundennummer"
              value={formData.kundennummer}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="K-12345"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
            🏢 Belegung/Branche *
          </label>
          <input
            type="text"
            name="belegung"
            value={formData.belegung}
            onChange={handleInputChange}
            list="belegung-list"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. Gastronomie, Einzelhandel..."
            required
          />
          <datalist id="belegung-list">
            {staticCategories.map(cat => (
              <option key={cat.id} value={cat.name} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              📅 Startdatum *
            </label>
            <input
              type="text"
              name="zeitraum_von"
              value={formData.zeitraum_von}
              onChange={handleInputChange}
              placeholder="tt.mm.jjjj (z.B. 15.07.2024)"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              📅 Enddatum *
            </label>
            <input
              type="text"
              name="zeitraum_bis"
              value={formData.zeitraum_bis}
              onChange={handleInputChange}
              placeholder="tt.mm.jjjj (z.B. 31.07.2024)"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              📍 Platzierung *
            </label>
            <select
              name="platzierung"
              value={formData.platzierung}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="1">Position 1 (Premium)</option>
              <option value="2">Position 2</option>
              <option value="3">Position 3</option>
              <option value="4">Position 4</option>
              <option value="5">Position 5</option>
              <option value="6">Position 6</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              📊 Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="reserviert">Reserviert</option>
              <option value="bestätigt">Bestätigt</option>
              <option value="aktiv">Aktiv</option>
              <option value="abgeschlossen">Abgeschlossen</option>
              <option value="storniert">Storniert</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
            👨‍💼 Berater *
          </label>
          <input
            type="text"
            name="berater"
            value={formData.berater}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Anna Schmidt"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded font-medium transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? '⏳ Wird erstellt...' : '✅ Buchung erstellen'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;


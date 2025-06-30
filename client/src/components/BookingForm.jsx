import { useState, useEffect } from 'react';

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
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Lade Kategorien von der API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://koeln-branchen-api.onrender.com';
        const response = await fetch(`${baseUrl}/api/categories`);
        
        if (response.ok) {
          const data = await response.json();
          // Backend gibt {success: true, data: [...]} zurück
          const categoriesArray = Array.isArray(data.data) ? data.data : [];
          setCategories(categoriesArray);
          console.log('Kategorien erfolgreich geladen:', categoriesArray.length);
        } else {
          console.error('Fehler beim Laden der Kategorien:', response.status);
          // Fallback zu leerer Liste
          setCategories([]);
        }
      } catch (error) {
        console.error('Netzwerkfehler beim Laden der Kategorien:', error);
        // Fallback zu leerer Liste
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

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

  // Konvertiert deutsches Datumsformat (dd.mm.yyyy) zu ISO 8601
  const convertDateToISO = (dateString, isEndDate = false) => {
    if (!dateString) return '';
    
    // Parse deutsches Format: dd.mm.yyyy
    const [day, month, year] = dateString.split('.');
    
    // Erstelle ISO 8601 Format
    // Startdatum: 00:00:00, Enddatum: 23:59:59 für ganztägige Abdeckung
    const time = isEndDate ? '23:59:59.000Z' : '00:00:00.000Z';
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`;
    
    return isoDate;
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
      // Konvertiere Daten für Backend (deutsches Format -> ISO 8601)
      const apiData = {
        ...formData,
        zeitraum_von: convertDateToISO(formData.zeitraum_von, false),
        zeitraum_bis: convertDateToISO(formData.zeitraum_bis, true),
        platzierung: parseInt(formData.platzierung) // Stelle sicher, dass es eine Zahl ist
      };

      console.log('Sending data to backend:', apiData);

      // API-URL mit Fallback
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://koeln-branchen-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
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
        // Backend-Validierungsfehler behandeln
        if (response.status === 400 && data.details) {
          const errorMessages = data.details.map(detail => `${detail.field}: ${detail.message}`);
          setMessage({ 
            type: 'error', 
            text: `Validierungsfehler: ${errorMessages.join(', ')}` 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: data.message || `Fehler ${response.status}: ${response.statusText}` 
          });
        }
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
            placeholder={categoriesLoading ? "Kategorien werden geladen..." : "z.B. Kanalreinigung"}
            required
            disabled={categoriesLoading}
          />
          <datalist id="belegung-list">
            {categories.map(cat => (
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
              <option value="vorreserviert">Vorreserviert</option>
              <option value="reserviert">Reserviert</option>
              <option value="gebucht">Gebucht</option>
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


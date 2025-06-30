import { useState, useEffect } from 'react';
import DatePicker from './DatePicker';

const EditBookingModal = ({ booking, isOpen, onClose, onBookingUpdated }) => {
  const [formData, setFormData] = useState({
    kundenname: '',
    kundennummer: '',
    belegung: '',
    zeitraum_von: '',
    zeitraum_bis: '',
    platzierung: '1',
    status: 'reserviert',
    berater: '',
    verkaufspreis: ''
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
          if (Array.isArray(data.data)) {
            setCategories(data.data);
          } else {
            console.warn('Categories data is not an array:', data);
            setCategories([]);
          }
        } else {
          console.error('Failed to fetch categories:', response.statusText);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Fülle Formular mit Buchungsdaten wenn Modal geöffnet wird
  useEffect(() => {
    if (booking && isOpen) {
      setFormData({
        kundenname: booking.kundenname || '',
        kundennummer: booking.kundennummer || '',
        belegung: booking.belegung || '',
        zeitraum_von: booking.zeitraum_von ? booking.zeitraum_von.split('T')[0] : '',
        zeitraum_bis: booking.zeitraum_bis ? booking.zeitraum_bis.split('T')[0] : '',
        platzierung: booking.platzierung?.toString() || '1',
        status: booking.status || 'reserviert',
        berater: booking.berater || '',
        verkaufspreis: booking.verkaufspreis || ''
      });
      setMessage({ type: '', text: '' });
    }
  }, [booking, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (field, date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validierung
      if (!formData.kundenname.trim()) {
        throw new Error('Kundenname ist erforderlich');
      }
      if (!formData.kundennummer.trim()) {
        throw new Error('Kundennummer ist erforderlich');
      }
      if (!formData.belegung.trim()) {
        throw new Error('Belegung ist erforderlich');
      }
      if (!formData.zeitraum_von) {
        throw new Error('Von-Datum ist erforderlich');
      }
      if (!formData.zeitraum_bis) {
        throw new Error('Bis-Datum ist erforderlich');
      }
      if (!formData.berater.trim()) {
        throw new Error('Berater ist erforderlich');
      }

      // Datum-Formatierung
      const formatDateForAPI = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00.000Z');
        return date.toISOString();
      };

      const formatEndDateForAPI = (dateStr) => {
        const date = new Date(dateStr + 'T23:59:59.000Z');
        return date.toISOString();
      };

      const bookingData = {
        kundenname: formData.kundenname.trim(),
        kundennummer: formData.kundennummer.trim(),
        belegung: formData.belegung.trim(),
        zeitraum_von: formatDateForAPI(formData.zeitraum_von),
        zeitraum_bis: formatEndDateForAPI(formData.zeitraum_bis),
        platzierung: parseInt(formData.platzierung),
        status: formData.status,
        berater: formData.berater.trim(),
        verkaufspreis: formData.verkaufspreis ? parseFloat(formData.verkaufspreis) : null
      };

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://koeln-branchen-api.onrender.com';
      const response = await fetch(`${baseUrl}/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Buchung erfolgreich aktualisiert!' 
        });
        
        // Benachrichtige Parent-Komponente
        if (onBookingUpdated) {
          onBookingUpdated(result.data);
        }
        
        // Schließe Modal nach kurzer Verzögerung
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(result.message || 'Fehler beim Aktualisieren der Buchung');
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Ein Fehler ist aufgetreten' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              ✏️ Buchung bearbeiten
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {message.text && (
            <div className={`mb-4 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
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
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="K-12345"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                🏢 Belegung *
              </label>
              {categoriesLoading ? (
                <input
                  type="text"
                  name="belegung"
                  value={formData.belegung}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Lade Kategorien..."
                  required
                />
              ) : (
                <input
                  type="text"
                  name="belegung"
                  value={formData.belegung}
                  onChange={handleInputChange}
                  list="categories-list"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="z.B. Kanalreinigung"
                  required
                />
              )}
              <datalist id="categories-list">
                {Array.isArray(categories) && categories.map((category) => (
                  <option key={category.id} value={category.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  📅 Von Datum *
                </label>
                <DatePicker
                  value={formData.zeitraum_von}
                  onChange={(date) => handleDateChange('zeitraum_von', date)}
                  placeholder="tt.mm.jjjj"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  📅 Bis Datum *
                </label>
                <DatePicker
                  value={formData.zeitraum_bis}
                  onChange={(date) => handleDateChange('zeitraum_bis', date)}
                  placeholder="tt.mm.jjjj"
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
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="1">Position 1</option>
                  <option value="2">Position 2</option>
                  <option value="3">Position 3</option>
                  <option value="4">Position 4</option>
                  <option value="5">Position 5</option>
                  <option value="6">Position 6</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  📊 Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Anna Schmidt"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                💰 Verkaufspreis (optional)
              </label>
              <input
                type="number"
                name="verkaufspreis"
                value={formData.verkaufspreis}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="1500.00"
                min="0"
                step="0.01"
              />
              <p className="text-sm text-gray-500 mt-1">
                Verkaufspreis in Euro (z.B. 1500.00)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {loading ? '💾 Wird gespeichert...' : '💾 Änderungen speichern'}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;


import { useState, useEffect } from 'react';
import DatePicker from './DatePicker'; // Import der neuen DatePicker-Komponente

const AvailabilityChecker = () => {
  const [checkData, setCheckData] = useState({
    zeitraum_von: '',
    zeitraum_bis: '',
    belegung: ''
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
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
          const categoriesArray = Array.isArray(data.data) ? data.data : [];
          setCategories(categoriesArray);
        } else {
          setCategories([]);
        }
      } catch (error) {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handler für DatePicker-Komponenten
  const handleDateChange = (name) => (value) => {
    setCheckData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler für andere Eingaben
  const handleInputChange = (e) => {
    setCheckData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

  // Konvertiert Datum von tt.mm.jjjj zu ISO Format
  const convertDateToISO = (dateString, isEndDate = false) => {
    if (!dateString) return '';
    
    const [day, month, year] = dateString.split('.');
    const time = isEndDate ? '23:59:59' : '00:00:00';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}.000Z`;
  };

  // Format date from ISO to dd.mm.yyyy
  const formatDateFromISO = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const validateForm = () => {
    const errors = [];

    if (!checkData.zeitraum_von) {
      errors.push('Startdatum ist erforderlich');
    } else if (!isValidDateFormat(checkData.zeitraum_von)) {
      errors.push('Startdatum muss im Format tt.mm.jjjj eingegeben werden');
    }

    if (!checkData.zeitraum_bis) {
      errors.push('Enddatum ist erforderlich');
    } else if (!isValidDateFormat(checkData.zeitraum_bis)) {
      errors.push('Enddatum muss im Format tt.mm.jjjj eingegeben werden');
    }

    // Prüfe ob Enddatum nach Startdatum liegt
    if (checkData.zeitraum_von && checkData.zeitraum_bis && 
        isValidDateFormat(checkData.zeitraum_von) && isValidDateFormat(checkData.zeitraum_bis)) {
      const [startDay, startMonth, startYear] = checkData.zeitraum_von.split('.').map(Number);
      const [endDay, endMonth, endYear] = checkData.zeitraum_bis.split('.').map(Number);
      
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      if (endDate < startDate) {
        errors.push('Enddatum muss nach dem Startdatum liegen');
      }
    }

    if (!checkData.belegung || checkData.belegung.trim() === '') {
      errors.push('Belegung/Branche ist erforderlich');
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
    setResults(null);

    try {
      // Konvertiere Daten für API - prüfe ALLE Platzierungen
      const apiData = {
        zeitraum_von: convertDateToISO(checkData.zeitraum_von, false),
        zeitraum_bis: convertDateToISO(checkData.zeitraum_bis, true),
        belegung: checkData.belegung,
        check_all_placements: true // Neue Flag für alle Platzierungen
      };

      console.log('Prüfe alle Platzierungen für Zeitraum:', apiData);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://koeln-branchen-api.onrender.com'}/api/availability/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (response.ok) {
        // Neue Datenstruktur für alle Platzierungen - API gibt data.data zurück
        const responseData = data.data || data; // Fallback für verschiedene API-Strukturen
        const validatedData = {
          available_placements: Array.isArray(responseData.available_placements) ? responseData.available_placements : [],
          occupied_placements: Array.isArray(responseData.occupied_placements) ? responseData.occupied_placements : [],
          message: data.message || responseData.message || ''
        };
        
        setResults(validatedData);
        
        const availableCount = validatedData.available_placements.length;
        const occupiedCount = validatedData.occupied_placements.length;
        
        setMessage({ 
          type: 'success', 
          text: `Prüfung abgeschlossen: ${availableCount} freie, ${occupiedCount} belegte Platzierungen gefunden.`
        });
        
        console.log('Verfügbarkeitsprüfung für alle Platzierungen erfolgreich:', validatedData);
        console.log('API Response Structure:', data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Fehler bei der Verfügbarkeitsprüfung' });
      }
    } catch (error) {
      console.error('Netzwerkfehler bei Verfügbarkeitsprüfung:', error);
      setMessage({ type: 'error', text: 'Netzwerkfehler. Bitte versuchen Sie es erneut.' });
    } finally {
      setLoading(false);
    }
  };

  // Schnellauswahl für häufige Zeiträume
  const setQuickDateRange = (days) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days);

    const formatDate = (date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    setCheckData(prev => ({
      ...prev,
      zeitraum_von: formatDate(today),
      zeitraum_bis: formatDate(endDate)
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        🔍 Verfügbarkeitsprüfung
      </h1>
      <p className="text-gray-600 mb-6">
        Prüfen Sie die Verfügbarkeit aller Platzierungen für einen bestimmten Zeitraum und eine Belegung
      </p>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Schnellauswahl */}
          <div>
            <label className="block text-sm font-medium mb-2">
              ⚡ Schnellauswahl
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuickDateRange(7)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Nächste 7 Tage
              </button>
              <button
                type="button"
                onClick={() => setQuickDateRange(30)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Nächste 30 Tage
              </button>
              <button
                type="button"
                onClick={() => setQuickDateRange(90)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Nächste 90 Tage
              </button>
              <button
                type="button"
                onClick={() => setQuickDateRange(365)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Nächstes Jahr
              </button>
            </div>
          </div>

          {/* Datumsfelder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                📅 Startdatum *
              </label>
              <DatePicker
                value={checkData.zeitraum_von}
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
                value={checkData.zeitraum_bis}
                onChange={handleDateChange('zeitraum_bis')}
                placeholder="tt.mm.jjjj (z.B. 20.07.2024)"
                name="zeitraum_bis"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: tt.mm.jjjj</p>
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
              value={checkData.belegung}
              onChange={handleInputChange}
              list="belegung-list"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
            {loading ? '⏳ Prüfe Verfügbarkeit...' : '🔍 Verfügbarkeit prüfen'}
          </button>
        </form>
      </div>

      {/* Ergebnisse */}
      {results && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            📊 Verfügbarkeitsergebnisse
          </h2>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              <strong>Zeitraum:</strong> {checkData.zeitraum_von} bis {checkData.zeitraum_bis}
            </p>
            <p className="text-gray-700">
              <strong>Belegung:</strong> {checkData.belegung}
            </p>
          </div>

          {/* Freie Platzierungen */}
          {results.available_placements && results.available_placements.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                ✅ Freie Platzierungen ({results.available_placements.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.available_placements.map((placement, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-800">
                          Position {placement.platzierung}
                        </h4>
                        <p className="text-sm text-green-700">
                          {placement.name || `Platzierung ${placement.platzierung}`}
                        </p>
                      </div>
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs bg-green-200 text-green-800 rounded">
                        Verfügbar
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Belegte Platzierungen */}
          {results.occupied_placements && results.occupied_placements.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                ❌ Belegte Platzierungen ({results.occupied_placements.length})
              </h3>
              <div className="space-y-3">
                {results.occupied_placements.map((placement, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-red-800 mb-1">
                          Position {placement.platzierung}
                        </h4>
                        <p className="text-sm text-red-700 mb-2">
                          <strong>Kunde:</strong> {placement.kundenname} ({placement.kundennummer})
                        </p>
                        <p className="text-sm text-red-700 mb-2">
                          <strong>Belegung:</strong> {placement.belegung}
                        </p>
                        <p className="text-sm text-red-600 mb-2">
                          <strong>Belegt vom:</strong> {formatDateFromISO(placement.zeitraum_von)} bis {formatDateFromISO(placement.zeitraum_bis)}
                        </p>
                        {placement.free_from && (
                          <p className="text-sm text-blue-700 font-medium">
                            🗓️ <strong>Wieder frei ab:</strong> {formatDateFromISO(placement.free_from)}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          placement.status === 'gebucht' ? 'bg-red-200 text-red-800' :
                          placement.status === 'reserviert' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {placement.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keine Ergebnisse */}
          {(!results.available_placements || results.available_placements.length === 0) && 
           (!results.occupied_placements || results.occupied_placements.length === 0) && (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">🤷‍♂️</span>
              <h3 className="font-semibold text-gray-800 mb-2">
                Keine Ergebnisse gefunden
              </h3>
              <p className="text-gray-600">
                Für den angegebenen Zeitraum und die Belegung wurden keine Platzierungen gefunden.
              </p>
            </div>
          )}

          {/* Zusammenfassung */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">
              📈 Zusammenfassung
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">
                  ✅ Freie Platzierungen: {results.available_placements ? results.available_placements.length : 0}
                </span>
              </div>
              <div>
                <span className="text-red-700 font-medium">
                  ❌ Belegte Platzierungen: {results.occupied_placements ? results.occupied_placements.length : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityChecker;


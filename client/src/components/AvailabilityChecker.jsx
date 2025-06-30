import { useState } from 'react';
import DatePicker from './DatePicker'; // Import der neuen DatePicker-Komponente

const AvailabilityChecker = () => {
  const [checkData, setCheckData] = useState({
    zeitraum_von: '',
    zeitraum_bis: '',
    platzierung: '1'
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

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

    if (!checkData.platzierung) {
      errors.push('Platzierung ist erforderlich');
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
      // Konvertiere Daten für API
      const apiData = {
        zeitraum_von: convertDateToISO(checkData.zeitraum_von, false),
        zeitraum_bis: convertDateToISO(checkData.zeitraum_bis, true),
        platzierung: parseInt(checkData.platzierung)
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://koeln-branchen-api.onrender.com'}/api/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (response.ok) {
        // Robuste Datenvalidierung
        const validatedData = {
          available: data.available || false,
          conflicts: Array.isArray(data.conflicts) ? data.conflicts : [],
          message: data.message || ''
        };
        
        setResults(validatedData);
        setMessage({ 
          type: 'success', 
          text: validatedData.available 
            ? 'Zeitraum ist verfügbar!' 
            : 'Zeitraum ist nicht verfügbar - es gibt Konflikte.'
        });
        console.log('Verfügbarkeitsprüfung erfolgreich:', validatedData);
      } else {
        setMessage({ type: 'error', text: data.message || 'Fehler bei der Verfügbarkeitsprüfung' });
      }
    } catch (error) {
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
        Prüfen Sie die Verfügbarkeit für einen bestimmten Zeitraum und eine Platzierung
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

          {/* Platzierung */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              📍 Platzierung *
            </label>
            <select
              name="platzierung"
              value={checkData.platzierung}
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
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Prüfungsergebnisse
          </h2>
          
          <div className={`p-4 rounded-md mb-4 ${
            results.available ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {results.available ? '✅' : '❌'}
              </span>
              <div>
                <h3 className={`font-semibold ${
                  results.available ? 'text-green-800' : 'text-red-800'
                }`}>
                  {results.available ? 'Verfügbar' : 'Nicht verfügbar'}
                </h3>
                <p className={`text-sm ${
                  results.available ? 'text-green-700' : 'text-red-700'
                }`}>
                  Platzierung {checkData.platzierung} vom {checkData.zeitraum_von} bis {checkData.zeitraum_bis}
                </p>
              </div>
            </div>
          </div>

          {/* Konflikte anzeigen */}
          {results.conflicts && results.conflicts.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-800 mb-3">
                🚫 Konflikte gefunden:
              </h3>
              <div className="space-y-2">
                {Array.isArray(results.conflicts) && results.conflicts.map((conflict, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-red-800">
                          {conflict.kundenname} ({conflict.kundennummer})
                        </p>
                        <p className="text-sm text-red-700">
                          {conflict.belegung}
                        </p>
                        <p className="text-sm text-red-600">
                          {formatDateFromISO(conflict.zeitraum_von)} bis {formatDateFromISO(conflict.zeitraum_bis)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        conflict.status === 'gebucht' ? 'bg-red-200 text-red-800' :
                        conflict.status === 'reserviert' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {conflict.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verfügbare alternative Zeiträume */}
          {!results.available && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-blue-800 mb-2">
                💡 Tipp: Alternative Zeiträume prüfen
              </h3>
              <p className="text-sm text-blue-700">
                Versuchen Sie andere Daten oder eine andere Platzierung für Ihre Buchung.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailabilityChecker;


import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Search, Building, MapPin, CalendarDays, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AvailabilityChecker = () => {
  const [formData, setFormData] = useState({
    belegung: '',
    platzierung: '',
    zeitraum_von: '',
    zeitraum_bis: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
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

  // Konvertiert ISO Datum zurück zu tt.mm.jjjj Format für Anzeige
  const formatDateForDisplay = (isoString) => {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.belegung.trim()) errors.push('Belegung ist erforderlich');
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
      setError(errors.join(', '));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Konvertiere Daten für API
      const queryParams = new URLSearchParams({
        belegung: formData.belegung,
        platzierung: formData.platzierung,
        zeitraum_von: convertDateToISO(formData.zeitraum_von, false),
        zeitraum_bis: convertDateToISO(formData.zeitraum_bis, true)
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/availability/check?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setResult(data.data);
      } else {
        setError(data.message || 'Fehler beim Prüfen der Verfügbarkeit');
      }
    } catch (error) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Verfügbarkeit prüfen
          </CardTitle>
          <CardDescription>
            Prüfen Sie die Verfügbarkeit für eine bestimmte Belegung, Platzierung und Zeitraum
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="belegung" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Belegung/Branche *
                </Label>
                <Input
                  id="belegung"
                  name="belegung"
                  value={formData.belegung}
                  onChange={handleInputChange}
                  placeholder="z.B. Gastronomie, Einzelhandel"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Platzierung *
                </Label>
                <Select value={formData.platzierung} onValueChange={(value) => handleSelectChange('platzierung', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Platzierung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Platzierung {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zeitraum_von" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Startdatum *
                </Label>
                <Input
                  id="zeitraum_von"
                  name="zeitraum_von"
                  value={formData.zeitraum_von}
                  onChange={handleInputChange}
                  placeholder="tt.mm.jjjj (z.B. 15.07.2024)"
                  required
                />
                <p className="text-xs text-gray-500">Format: tt.mm.jjjj</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zeitraum_bis" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Enddatum *
                </Label>
                <Input
                  id="zeitraum_bis"
                  name="zeitraum_bis"
                  value={formData.zeitraum_bis}
                  onChange={handleInputChange}
                  placeholder="tt.mm.jjjj (z.B. 20.07.2024)"
                  required
                />
                <p className="text-xs text-gray-500">Format: tt.mm.jjjj</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Wird geprüft...' : 'Verfügbarkeit prüfen'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.available ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Verfügbarkeitsergebnis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Belegung</Label>
                  <p className="text-lg">{result.belegung}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Platzierung</Label>
                  <p className="text-lg">Platzierung {result.platzierung}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Zeitraum</Label>
                  <p className="text-lg">
                    {formatDateForDisplay(result.zeitraum_von)} - {formatDateForDisplay(result.zeitraum_bis)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="flex items-center gap-2">
                    {result.available ? (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 font-medium">Verfügbar</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-red-700 font-medium">Nicht verfügbar</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {result.conflicts && result.conflicts.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-600">Konflikte</Label>
                  <div className="mt-2 space-y-2">
                    {result.conflicts.map((conflict, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-red-900">{conflict.kundenname}</p>
                            <p className="text-sm text-red-700">
                              {formatDateForDisplay(conflict.zeitraum_von)} - {formatDateForDisplay(conflict.zeitraum_bis)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            conflict.status === 'gebucht' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {conflict.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AvailabilityChecker;


import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CalendarDays, User, Building, MapPin, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';

const BookingForm = ({ onBookingCreated }) => {
  const [formData, setFormData] = useState({
    kundenname: '',
    kundennummer: '',
    belegung: '',
    zeitraum_von: '',
    zeitraum_bis: '',
    platzierung: '',
    status: 'reserviert',
    berater: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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

  // Konvertiert Datum von tt.mm.jjjj zu ISO Format (mit 00:00:00 für Start, 23:59:59 für Ende)
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
        setFormData({
          kundenname: '',
          kundennummer: '',
          belegung: '',
          zeitraum_von: '',
          zeitraum_bis: '',
          platzierung: '',
          status: 'reserviert',
          berater: ''
        });
        if (onBookingCreated) onBookingCreated();
      } else {
        if (response.status === 409) {
          setMessage({ 
            type: 'error', 
            text: 'Konflikt: Ein Termin für diese Belegung, Platzierung und Zeitraum ist bereits vorhanden.' 
          });
        } else {
          setMessage({ type: 'error', text: data.message || 'Fehler beim Erstellen der Buchung' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Netzwerkfehler. Bitte versuchen Sie es erneut.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Neue Buchung erstellen
        </CardTitle>
        <CardDescription>
          Erstellen Sie eine neue Buchung für das Köln Branchen Portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kundenname" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Kundenname *
              </Label>
              <Input
                id="kundenname"
                name="kundenname"
                value={formData.kundenname}
                onChange={handleInputChange}
                placeholder="Max Mustermann"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kundennummer" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Kundennummer *
              </Label>
              <Input
                id="kundennummer"
                name="kundennummer"
                value={formData.kundennummer}
                onChange={handleInputChange}
                placeholder="K-001"
                required
              />
            </div>
          </div>

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
              placeholder="z.B. Gastronomie, Einzelhandel, Dienstleistung"
              required
            />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frei">Frei</SelectItem>
                  <SelectItem value="reserviert">Reserviert</SelectItem>
                  <SelectItem value="gebucht">Gebucht</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="berater" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Berater *
            </Label>
            <Input
              id="berater"
              name="berater"
              value={formData.berater}
              onChange={handleInputChange}
              placeholder="Anna Schmidt"
              required
            />
          </div>

          {message.text && (
            <div className={`p-3 rounded-md flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Wird erstellt...' : 'Buchung erstellen'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;


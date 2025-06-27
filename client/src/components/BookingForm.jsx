import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, User, Building, MapPin, Clock, UserCheck, Save, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

function BookingForm() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    kundenname: '',
    kundennummer: '',
    belegung: '',
    zeitraum_von: '',
    zeitraum_bis: '',
    platzierung: '',
    status: 'reserviert',
    berater: ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear errors when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.kundenname.trim()) errors.push('Kundenname ist erforderlich')
    if (!formData.kundennummer.trim()) errors.push('Kundennummer ist erforderlich')
    if (!formData.belegung.trim()) errors.push('Belegung ist erforderlich')
    if (!formData.zeitraum_von) errors.push('Startdatum ist erforderlich')
    if (!formData.zeitraum_bis) errors.push('Enddatum ist erforderlich')
    if (!formData.platzierung) errors.push('Platzierung ist erforderlich')
    if (!formData.berater.trim()) errors.push('Berater ist erforderlich')
    
    if (formData.zeitraum_von && formData.zeitraum_bis) {
      const startDate = new Date(formData.zeitraum_von)
      const endDate = new Date(formData.zeitraum_bis)
      if (endDate <= startDate) {
        errors.push('Enddatum muss nach dem Startdatum liegen')
      }
    }
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Fehler beim Erstellen der Buchung')
      }
      
      setSuccess('Buchung erfolgreich erstellt!')
      
      // Reset form
      setFormData({
        kundenname: '',
        kundennummer: '',
        belegung: '',
        zeitraum_von: '',
        zeitraum_bis: '',
        platzierung: '',
        status: 'reserviert',
        berater: ''
      })
      
      // Redirect to overview after 2 seconds
      setTimeout(() => {
        navigate('/')
      }, 2000)
      
    } catch (err) {
      console.error('Booking error:', err)
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Neue Buchung</h1>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Buchungsdetails</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kundenname" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Kundenname *</span>
                </Label>
                <Input
                  id="kundenname"
                  type="text"
                  value={formData.kundenname}
                  onChange={(e) => handleInputChange('kundenname', e.target.value)}
                  placeholder="Max Mustermann"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kundennummer" className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Kundennummer *</span>
                </Label>
                <Input
                  id="kundennummer"
                  type="text"
                  value={formData.kundennummer}
                  onChange={(e) => handleInputChange('kundennummer', e.target.value)}
                  placeholder="K-12345"
                  required
                />
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-2">
              <Label htmlFor="belegung" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Belegung (Branche) *</span>
              </Label>
              <Input
                id="belegung"
                type="text"
                value={formData.belegung}
                onChange={(e) => handleInputChange('belegung', e.target.value)}
                placeholder="z.B. Gastronomie, Einzelhandel, Dienstleistung"
                required
              />
            </div>

            {/* Time Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zeitraum_von" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Zeitraum von *</span>
                </Label>
                <Input
                  id="zeitraum_von"
                  type="datetime-local"
                  value={formData.zeitraum_von}
                  onChange={(e) => handleInputChange('zeitraum_von', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zeitraum_bis" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Zeitraum bis *</span>
                </Label>
                <Input
                  id="zeitraum_bis"
                  type="datetime-local"
                  value={formData.zeitraum_bis}
                  onChange={(e) => handleInputChange('zeitraum_bis', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Placement and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platzierung" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Platzierung *</span>
                </Label>
                <Select
                  value={formData.platzierung}
                  onValueChange={(value) => handleInputChange('platzierung', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Platz auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Platz {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
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

            {/* Advisor */}
            <div className="space-y-2">
              <Label htmlFor="berater" className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4" />
                <span>Berater *</span>
              </Label>
              <Input
                id="berater"
                type="text"
                value={formData.berater}
                onChange={(e) => handleInputChange('berater', e.target.value)}
                placeholder="Name des zuständigen Beraters"
                required
              />
            </div>

            {/* Error and Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Speichern...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Speichern</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default BookingForm


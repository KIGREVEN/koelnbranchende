import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Calendar, 
  Building, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

function AvailabilityChecker() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [availabilityResult, setAvailabilityResult] = useState(null)
  const [overviewResult, setOverviewResult] = useState(null)
  const [activeTab, setActiveTab] = useState('single') // 'single' or 'overview'
  
  const [singleCheck, setSingleCheck] = useState({
    belegung: '',
    platzierung: '',
    zeitraum_von: '',
    zeitraum_bis: ''
  })

  const [overviewCheck, setOverviewCheck] = useState({
    belegung: '',
    zeitraum_von: '',
    zeitraum_bis: '',
    platzierung_min: '1',
    platzierung_max: '6'
  })

  const handleSingleCheckChange = (field, value) => {
    setSingleCheck(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear results when form changes
    if (availabilityResult) setAvailabilityResult(null)
    if (error) setError('')
  }

  const handleOverviewCheckChange = (field, value) => {
    setOverviewCheck(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear results when form changes
    if (overviewResult) setOverviewResult(null)
    if (error) setError('')
  }

  const validateSingleCheck = () => {
    const errors = []
    
    if (!singleCheck.belegung.trim()) errors.push('Belegung ist erforderlich')
    if (!singleCheck.platzierung) errors.push('Platzierung ist erforderlich')
    if (!singleCheck.zeitraum_von) errors.push('Startdatum ist erforderlich')
    if (!singleCheck.zeitraum_bis) errors.push('Enddatum ist erforderlich')
    
    if (singleCheck.zeitraum_von && singleCheck.zeitraum_bis) {
      const startDate = new Date(singleCheck.zeitraum_von)
      const endDate = new Date(singleCheck.zeitraum_bis)
      if (endDate <= startDate) {
        errors.push('Enddatum muss nach dem Startdatum liegen')
      }
    }
    
    return errors
  }

  const validateOverviewCheck = () => {
    const errors = []
    
    if (!overviewCheck.zeitraum_von) errors.push('Startdatum ist erforderlich')
    if (!overviewCheck.zeitraum_bis) errors.push('Enddatum ist erforderlich')
    
    if (overviewCheck.zeitraum_von && overviewCheck.zeitraum_bis) {
      const startDate = new Date(overviewCheck.zeitraum_von)
      const endDate = new Date(overviewCheck.zeitraum_bis)
      if (endDate <= startDate) {
        errors.push('Enddatum muss nach dem Startdatum liegen')
      }
    }
    
    const minPlatz = parseInt(overviewCheck.platzierung_min)
    const maxPlatz = parseInt(overviewCheck.platzierung_max)
    if (minPlatz > maxPlatz) {
      errors.push('Minimale Platzierung muss kleiner oder gleich der maximalen sein')
    }
    
    return errors
  }

  const checkSingleAvailability = async () => {
    const validationErrors = validateSingleCheck()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }
    
    setIsLoading(true)
    setError('')
    setAvailabilityResult(null)
    
    try {
      const params = new URLSearchParams(singleCheck)
      const response = await fetch(`${API_BASE_URL}/api/availability/check?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Fehler bei der Verfügbarkeitsprüfung')
      }
      
      const data = await response.json()
      setAvailabilityResult(data.data)
    } catch (err) {
      console.error('Availability check error:', err)
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const checkOverviewAvailability = async () => {
    const validationErrors = validateOverviewCheck()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }
    
    setIsLoading(true)
    setError('')
    setOverviewResult(null)
    
    try {
      const params = new URLSearchParams(overviewCheck)
      const response = await fetch(`${API_BASE_URL}/api/availability/overview?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Fehler bei der Verfügbarkeitsprüfung')
      }
      
      const data = await response.json()
      setOverviewResult(data.data)
    } catch (err) {
      console.error('Overview check error:', err)
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAvailabilityIcon = (available) => {
    if (available) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getAvailabilityBadge = (status) => {
    const colors = {
      frei: 'bg-green-100 text-green-800 border-green-200',
      belegt: 'bg-red-100 text-red-800 border-red-200'
    }
    
    const labels = {
      frei: 'Verfügbar',
      belegt: 'Belegt'
    }
    
    return (
      <Badge className={colors[status]}>
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Verfügbarkeitsprüfung</h1>
        <Link to="/booking">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neue Buchung
          </Button>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'single' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('single')}
        >
          Einzelprüfung
        </Button>
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
        >
          Übersicht
        </Button>
      </div>

      {/* Single Availability Check */}
      {activeTab === 'single' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Einzelne Verfügbarkeitsprüfung</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="single-belegung" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Belegung (Branche) *</span>
                </Label>
                <Input
                  id="single-belegung"
                  type="text"
                  value={singleCheck.belegung}
                  onChange={(e) => handleSingleCheckChange('belegung', e.target.value)}
                  placeholder="z.B. Gastronomie, Einzelhandel"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="single-platzierung" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Platzierung *</span>
                </Label>
                <Select
                  value={singleCheck.platzierung}
                  onValueChange={(value) => handleSingleCheckChange('platzierung', value)}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="single-von" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Zeitraum von *</span>
                </Label>
                <Input
                  id="single-von"
                  type="datetime-local"
                  value={singleCheck.zeitraum_von}
                  onChange={(e) => handleSingleCheckChange('zeitraum_von', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="single-bis" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Zeitraum bis *</span>
                </Label>
                <Input
                  id="single-bis"
                  type="datetime-local"
                  value={singleCheck.zeitraum_bis}
                  onChange={(e) => handleSingleCheckChange('zeitraum_bis', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={checkSingleAvailability}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Prüfen...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Verfügbarkeit prüfen</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Single Check Result */}
            {availabilityResult && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getAvailabilityIcon(availabilityResult.available)}
                    <span>Prüfungsergebnis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Belegung</Label>
                        <p className="text-sm">{availabilityResult.belegung}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Platzierung</Label>
                        <p className="text-sm">Platz {availabilityResult.platzierung}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Zeitraum</Label>
                        <p className="text-sm">
                          {formatDateTime(availabilityResult.zeitraum_von)} - {formatDateTime(availabilityResult.zeitraum_bis)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                        <div className="mt-1">
                          {getAvailabilityBadge(availabilityResult.status)}
                        </div>
                      </div>
                    </div>

                    {availabilityResult.conflicts && availabilityResult.conflicts.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">
                          Konflikte ({availabilityResult.conflicts.length})
                        </Label>
                        <div className="space-y-2">
                          {availabilityResult.conflicts.map((conflict, index) => (
                            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="flex items-center space-x-2 mb-1">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-800">{conflict.kundenname}</span>
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  {conflict.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-red-700">
                                {formatDateTime(conflict.zeitraum_von)} - {formatDateTime(conflict.zeitraum_bis)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {availabilityResult.available && (
                      <div className="flex justify-end">
                        <Link to="/booking" state={{ prefill: singleCheck }}>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Jetzt buchen
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overview Availability Check */}
      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Verfügbarkeitsübersicht</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overview-belegung" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Belegung (optional)</span>
                </Label>
                <Input
                  id="overview-belegung"
                  type="text"
                  value={overviewCheck.belegung}
                  onChange={(e) => handleOverviewCheckChange('belegung', e.target.value)}
                  placeholder="Leer lassen für alle Belegungen"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="overview-von" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Zeitraum von *</span>
                </Label>
                <Input
                  id="overview-von"
                  type="datetime-local"
                  value={overviewCheck.zeitraum_von}
                  onChange={(e) => handleOverviewCheckChange('zeitraum_von', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="overview-bis" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Zeitraum bis *</span>
                </Label>
                <Input
                  id="overview-bis"
                  type="datetime-local"
                  value={overviewCheck.zeitraum_bis}
                  onChange={(e) => handleOverviewCheckChange('zeitraum_bis', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overview-min" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Platzierung von</span>
                </Label>
                <Select
                  value={overviewCheck.platzierung_min}
                  onValueChange={(value) => handleOverviewCheckChange('platzierung_min', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="overview-max" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Platzierung bis</span>
                </Label>
                <Select
                  value={overviewCheck.platzierung_max}
                  onValueChange={(value) => handleOverviewCheckChange('platzierung_max', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <div className="flex justify-end">
              <Button
                onClick={checkOverviewAvailability}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Prüfen...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Übersicht erstellen</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Overview Result */}
            {overviewResult && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Verfügbarkeitsübersicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="font-medium text-gray-600">Zeitraum</Label>
                        <p>{formatDateTime(overviewResult.zeitraum_von)} - {formatDateTime(overviewResult.zeitraum_bis)}</p>
                      </div>
                      <div>
                        <Label className="font-medium text-gray-600">Belegung</Label>
                        <p>{overviewResult.belegung}</p>
                      </div>
                      <div>
                        <Label className="font-medium text-gray-600">Platzierungen</Label>
                        <p>{overviewResult.platzierung_range}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {overviewResult.overview.map((item, index) => (
                        <Card key={index} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Platz {item.platzierung}</h4>
                              {getAvailabilityIcon(item.available)}
                            </div>
                            <div className="space-y-2">
                              <div>
                                {getAvailabilityBadge(item.status)}
                              </div>
                              {item.conflicts && item.conflicts.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">
                                    {item.conflicts.length} Konflikt(e)
                                  </p>
                                  <div className="space-y-1">
                                    {item.conflicts.slice(0, 2).map((conflict, idx) => (
                                      <div key={idx} className="text-xs p-2 bg-red-50 rounded">
                                        <div className="font-medium">{conflict.kundenname}</div>
                                        <div className="text-gray-600">{conflict.belegung}</div>
                                      </div>
                                    ))}
                                    {item.conflicts.length > 2 && (
                                      <p className="text-xs text-gray-500">
                                        +{item.conflicts.length - 2} weitere
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                              {item.available && (
                                <Link 
                                  to="/booking" 
                                  state={{ 
                                    prefill: { 
                                      ...overviewCheck, 
                                      platzierung: item.platzierung.toString() 
                                    } 
                                  }}
                                >
                                  <Button size="sm" className="w-full">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Buchen
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default AvailabilityChecker


import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  User, 
  Building, 
  MapPin, 
  Clock,
  Edit,
  Trash2,
  RefreshCw,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

function BookingOverview() {
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState({
    search: '',
    belegung: '',
    berater: '',
    status: '',
    platzierung: ''
  })

  const statusColors = {
    frei: 'bg-green-100 text-green-800 border-green-200',
    reserviert: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    gebucht: 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const statusLabels = {
    frei: 'Frei',
    reserviert: 'Reserviert',
    gebucht: 'Gebucht'
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [bookings, filters])

  const fetchBookings = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`)
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Buchungen')
      }
      
      const data = await response.json()
      setBookings(data.data || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...bookings]
    
    // Search filter (searches in multiple fields)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(booking =>
        booking.kundenname.toLowerCase().includes(searchTerm) ||
        booking.kundennummer.toLowerCase().includes(searchTerm) ||
        booking.belegung.toLowerCase().includes(searchTerm) ||
        booking.berater.toLowerCase().includes(searchTerm)
      )
    }
    
    // Specific filters
    if (filters.belegung) {
      filtered = filtered.filter(booking =>
        booking.belegung.toLowerCase().includes(filters.belegung.toLowerCase())
      )
    }
    
    if (filters.berater) {
      filtered = filtered.filter(booking =>
        booking.berater.toLowerCase().includes(filters.berater.toLowerCase())
      )
    }
    
    if (filters.status) {
      filtered = filtered.filter(booking => booking.status === filters.status)
    }
    
    if (filters.platzierung) {
      filtered = filtered.filter(booking => booking.platzierung === parseInt(filters.platzierung))
    }
    
    setFilteredBookings(filtered)
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      belegung: '',
      berater: '',
      status: '',
      platzierung: ''
    })
  }

  const deleteBooking = async (id) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Buchung löschen möchten?')) {
      return
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Buchung')
      }
      
      // Remove from local state
      setBookings(prev => prev.filter(booking => booking.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
      setError(err.message || 'Fehler beim Löschen der Buchung')
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

  const exportBookings = () => {
    const csvContent = [
      ['ID', 'Kundenname', 'Kundennummer', 'Belegung', 'Von', 'Bis', 'Platzierung', 'Status', 'Berater'],
      ...filteredBookings.map(booking => [
        booking.id,
        booking.kundenname,
        booking.kundennummer,
        booking.belegung,
        formatDateTime(booking.zeitraum_von),
        formatDateTime(booking.zeitraum_bis),
        booking.platzierung,
        statusLabels[booking.status],
        booking.berater
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `buchungen_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Buchungen werden geladen...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Buchungsübersicht</h1>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportBookings}
            disabled={filteredBookings.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBookings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Link to="/booking">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Neue Buchung
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gebucht</p>
                <p className="text-2xl font-bold text-blue-600">
                  {bookings.filter(b => b.status === 'gebucht').length}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reserviert</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter(b => b.status === 'reserviert').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Frei</p>
                <p className="text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.status === 'frei').length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ausblenden' : 'Anzeigen'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Suche</Label>
                <Input
                  id="search"
                  placeholder="Name, Nummer, Branche..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="belegung">Belegung</Label>
                <Input
                  id="belegung"
                  placeholder="Branche..."
                  value={filters.belegung}
                  onChange={(e) => handleFilterChange('belegung', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="berater">Berater</Label>
                <Input
                  id="berater"
                  placeholder="Berater..."
                  value={filters.berater}
                  onChange={(e) => handleFilterChange('berater', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle</SelectItem>
                    <SelectItem value="frei">Frei</SelectItem>
                    <SelectItem value="reserviert">Reserviert</SelectItem>
                    <SelectItem value="gebucht">Gebucht</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platzierung">Platzierung</Label>
                <Select
                  value={filters.platzierung}
                  onValueChange={(value) => handleFilterChange('platzierung', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle</SelectItem>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Platz {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Filter zurücksetzen
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {filteredBookings.length} von {bookings.length} Buchungen angezeigt
        </span>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Buchungen gefunden
              </h3>
              <p className="text-gray-600 mb-4">
                {bookings.length === 0 
                  ? 'Es sind noch keine Buchungen vorhanden.'
                  : 'Keine Buchungen entsprechen den aktuellen Filterkriterien.'
                }
              </p>
              <Link to="/booking">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Erste Buchung erstellen
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kunde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Belegung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zeitraum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Berater
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.kundenname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.kundennummer}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.belegung}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(booking.zeitraum_von)}
                        </div>
                        <div className="text-sm text-gray-500">
                          bis {formatDateTime(booking.zeitraum_bis)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">
                          Platz {booking.platzierung}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={statusColors[booking.status]}>
                          {statusLabels[booking.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.berater}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* TODO: Implement edit */}}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBooking(booking.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default BookingOverview


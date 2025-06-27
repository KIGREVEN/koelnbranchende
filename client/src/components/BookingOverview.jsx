import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Filter, Trash2, Edit, Calendar, User, Building, MapPin, UserCheck, RefreshCw } from 'lucide-react';

const BookingOverview = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    belegung: '',
    berater: '',
    status: '',
    platzierung: ''
  });

  // Konvertiert ISO Datum zu tt.mm.jjjj Format
  const formatDateForDisplay = (isoString) => {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`);
      const data = await response.json();
      
      if (response.ok) {
        setBookings(data.data || []);
        setError('');
      } else {
        setError(data.message || 'Fehler beim Laden der Buchungen');
      }
    } catch (error) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    let filtered = bookings;

    // Textsuche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.kundenname.toLowerCase().includes(searchLower) ||
        booking.kundennummer.toLowerCase().includes(searchLower) ||
        booking.belegung.toLowerCase().includes(searchLower) ||
        booking.berater.toLowerCase().includes(searchLower)
      );
    }

    // Belegung Filter
    if (filters.belegung) {
      filtered = filtered.filter(booking => 
        booking.belegung.toLowerCase().includes(filters.belegung.toLowerCase())
      );
    }

    // Berater Filter
    if (filters.berater) {
      filtered = filtered.filter(booking => 
        booking.berater.toLowerCase().includes(filters.berater.toLowerCase())
      );
    }

    // Status Filter
    if (filters.status) {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Platzierung Filter
    if (filters.platzierung) {
      filtered = filtered.filter(booking => booking.platzierung.toString() === filters.platzierung);
    }

    setFilteredBookings(filtered);
  }, [bookings, filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Buchung löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchBookings(); // Neu laden
      } else {
        const data = await response.json();
        alert(data.message || 'Fehler beim Löschen der Buchung');
      }
    } catch (error) {
      alert('Netzwerkfehler beim Löschen der Buchung');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'frei':
        return 'bg-green-100 text-green-800';
      case 'reserviert':
        return 'bg-yellow-100 text-yellow-800';
      case 'gebucht':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      belegung: '',
      berater: '',
      status: '',
      platzierung: ''
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Buchungen werden geladen...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Buchungsübersicht
          </CardTitle>
          <CardDescription>
            Verwalten und filtern Sie alle Buchungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Section */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </h3>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Filter zurücksetzen
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Suche
                </Label>
                <Input
                  id="search"
                  placeholder="Name, Nummer, Belegung..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Belegung
                </Label>
                <Input
                  placeholder="z.B. Gastronomie"
                  value={filters.belegung}
                  onChange={(e) => handleFilterChange('belegung', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Berater
                </Label>
                <Input
                  placeholder="z.B. Anna Schmidt"
                  value={filters.berater}
                  onChange={(e) => handleFilterChange('berater', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Status</SelectItem>
                    <SelectItem value="frei">Frei</SelectItem>
                    <SelectItem value="reserviert">Reserviert</SelectItem>
                    <SelectItem value="gebucht">Gebucht</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Platzierung
                </Label>
                <Select value={filters.platzierung} onValueChange={(value) => handleFilterChange('platzierung', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Platzierungen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Platzierungen</SelectItem>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Platzierung {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={fetchBookings} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aktualisieren
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-700 border border-red-200 mb-4">
              {error}
            </div>
          )}

          {/* Results Summary */}
          <div className="mb-4 text-sm text-gray-600">
            {filteredBookings.length} von {bookings.length} Buchungen angezeigt
          </div>

          {/* Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Belegung</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Platzierung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Berater</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Keine Buchungen gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.kundenname}</div>
                          <div className="text-sm text-gray-500">{booking.kundennummer}</div>
                        </div>
                      </TableCell>
                      <TableCell>{booking.belegung}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDateForDisplay(booking.zeitraum_von)}</div>
                          <div className="text-gray-500">bis {formatDateForDisplay(booking.zeitraum_bis)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {booking.platzierung}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {booking.berater}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(booking.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingOverview;


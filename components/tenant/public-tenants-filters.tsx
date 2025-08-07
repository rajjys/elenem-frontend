import { Search } from "lucide-react";
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui";
import { SportType } from "@/schemas";
import { CountryDropdown } from "react-country-region-selector";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

function PublicTenantsFilters({ onFilterChange }: { onFilterChange: (filters: {search?: string, sportType?: string, country?: string}) => void }) {
    const [search, setSearch] = useState('');
    const [sportType, setSportType] = useState('');
    const [country, setCountry] = useState('');
    const [debouncedSearch] = useDebounce(search, 500);

    useEffect(() => {
        onFilterChange({
            search: debouncedSearch || undefined,
            sportType: sportType || undefined,
            country: country || undefined,
        });
    }, [debouncedSearch, sportType, country, onFilterChange]);

    return (
        <div className="p-4 bg-card border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
                <Label htmlFor="search">Search Tenant</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="search" placeholder="Name or code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                </div>
            </div>
            <div>
                <Label htmlFor="sportType">Sport</Label>
                <Select value={sportType} onValueChange={setSportType}>
                    <SelectTrigger id="sportType"><SelectValue placeholder="Tout les sports" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="null">Tout les sports</SelectItem>
                        {Object.values(SportType).map(type => (
                            <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="country">Pays</Label>
                <CountryDropdown value={country} onChange={setCountry} className="w-full p-2 border rounded-md bg-transparent" />
            </div>
        </div>
    );
}

export default PublicTenantsFilters;
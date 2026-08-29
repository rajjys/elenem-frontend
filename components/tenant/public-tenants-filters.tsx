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
        <div className="p-2 md:p-4 bg-surface border border-line rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-2 gap-y-4 items-end">
            {/* 🔍 Search Input */}
            <div className="md:col-span-2 flex flex-col">
                <Label htmlFor="search" className="text-sm font-medium text-ink mb-1" >
                    Rechercher une ligue
                </Label>
                <Input
                    id="search"
                    type="search"
                    placeholder="Nom ou code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 py-2 border border-line bg-surface text-ink rounded-md focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200"
                />
            </div>

            {/* 🏅 Sport Type Select */}
            <div className="flex flex-col">
                <Label
                htmlFor="sportType"
                className="text-sm font-medium text-ink mb-1"
                >
                Sport
                </Label>
                <Select
                    value={sportType}
                    onValueChange={(value) => setSportType(value === "null" ? "" : value)}
                >
                <SelectTrigger
                    id="sportType"
                    className="w-full border border-line bg-surface text-ink rounded-md focus:ring-2 focus:ring-accent">
                    <SelectValue placeholder="Sélectionner un sport" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="null" className="bg-surface text-ink ">Tous les sports</SelectItem>
                    {Object.values(SportType).map((type) => (
                    <SelectItem key={type} value={type} className="bg-surface hover:bg-blue-900 text-ink ">
                        {type.replace("_", " ")}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            {/* 🌍 Country Dropdown */}
            <div className="flex flex-col">
                <Label
                htmlFor="country"
                className="text-sm font-medium text-ink mb-1"
                >
                Pays
                </Label>
                <CountryDropdown
                value={country}
                onChange={setCountry}
                valueType="short"
                className="w-full px-3 py-2 border border-accent rounded-md bg-surface text-sm text-accent-text focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200"
                />
            </div>
        </div>

);

}

export default PublicTenantsFilters;
"use client";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SingleValue } from 'react-select';
import { US_CITIES, CityOption, searchCities } from '../data/cities';

const Select = dynamic(() => import("react-select"), { ssr: false });

interface CitySelectorProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
  isClearable?: boolean;
  isSearchable?: boolean;
  disabled?: boolean;
}

export default function CitySelector({
  value,
  onChange,
  placeholder = "Şehir seçin...",
  className = "",
  isClearable = true,
  isSearchable = true,
  disabled = false
}: CitySelectorProps) {
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);

  useEffect(() => {
    const city = US_CITIES.find(c => c.value === value);
    if (city) {
      console.log('🏙️ City found in list:', city.label);
      setSelectedCity(city);
    } else if (value) {
      console.log('❌ City not found in list:', value);
      setSelectedCity(null);
    }
  }, [value]);

  return (
    <div className={`relative z-[999999] ${className}`}>
      <Select
        options={US_CITIES}
        value={selectedCity}
        onChange={(option) => {
          const cityOption = option as CityOption | null;
          setSelectedCity(cityOption);
          onChange(cityOption?.value || "");
        }}
        placeholder={placeholder}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isDisabled={disabled}
        classNamePrefix="react-select"
        noOptionsMessage={() => "Şehir bulunamadı"}
        loadingMessage={() => "Aranıyor..."}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
        styles={{
          control: (base) => ({
            ...base,
            minHeight: "48px",
            borderRadius: "0.75rem",
            borderColor: "rgba(255, 255, 255, 0.3)",
            boxShadow: "none",
            backgroundColor: "white",
            fontSize: "16px",
            paddingLeft: "40px", 
            backgroundImage: "url('/location_pin_icon.svg')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "18px center",
            backgroundSize: "18px 20px",
            "&:hover": {
              borderColor: "rgba(255, 255, 255, 0.5)",
              backgroundColor: "white",
            },
            "&:focus-within": {
              borderColor: "#bf988a",
              boxShadow: "0 0 0 2px rgba(191, 152, 138, 0.3)"
            }
          }),
          valueContainer: (base) => ({
            ...base,
            paddingLeft: "8px", // Adjust padding since we added space for icon
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected 
              ? "#2563eb" 
              : state.isFocused 
                ? "rgba(37, 99, 235, 0.1)" 
                : "rgba(255, 255, 255, 1)",
            color: state.isSelected ? "white" : "#1f2937",
            fontSize: "14px",
            padding: "12px 16px",
            fontWeight: state.isSelected ? "600" : "500",
            "&:hover": {
              backgroundColor: state.isSelected ? "#2563eb" : "rgba(37, 99, 235, 0.15)"
            }
          }),
          menu: (base) => ({
            ...base,
            zIndex: 999999,
            backgroundColor: "rgba(255, 255, 255, 1)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            borderRadius: "0.75rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
          }),
          menuList: (base) => ({
            ...base,
            backgroundColor: "transparent",
            padding: "8px 0",
            borderRadius: "0.75rem"
          }),
          placeholder: (base) => ({
            ...base,
            color: "gray",
            whiteSpace: "nowrap",
            overflow: "hidden", 
            fontSize: "14px"
          }),
          singleValue: (base) => ({
            ...base,
            color: "gray",
            fontWeight: "500"
          }),
          input: (base) => ({
            ...base,
            color: "gray",
            "&::placeholder": {
              color: "gray"
            }
          }),
          indicatorsContainer: (base) => ({
            ...base,
            "& svg": {
              color: "gray"
            }
          }),
          clearIndicator: (base) => ({
            ...base,
            "&:hover": {
              color: "rgba(255, 255, 255, 0.9)"
            }
          }),
          dropdownIndicator: (base) => ({
            ...base,
            "&:hover": {
              color: "rgba(255, 255, 255, 0.9)"
            }
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 999999
          })
        }}
      />
    </div>
  );
}
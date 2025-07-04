"use client";
import { MockupLocation } from "@/app/constants";
import dynamic from "next/dynamic";

const DynamicSelect = dynamic(() => import("react-select"), { ssr: false });

interface StoreObj {
  id: string;
  lat?: string;
  long?: string;
  name: string;
  note: string;
  address?: string;
  phone?: string;
}

interface SearchableDropdownProps {
  onBusinessSelect: (business: StoreObj | null) => void;
  onRefocusCurrentLocation: () => void;
}

const options = MockupLocation.map((store) => ({
  value: store.id,
  label: store.name,
}));

export default function SearchableDropdown({
  onBusinessSelect,
  onRefocusCurrentLocation,
}: SearchableDropdownProps) {
  const handleChange = (selectedOption: unknown) => {
    if (!selectedOption) {
      // When cleared, refocus on current location
      onBusinessSelect(null);
      onRefocusCurrentLocation();
      return;
    }

    const selectedStore = MockupLocation.find(
      (location) =>
        location.id.toString() ===
        (selectedOption as { value: string; label: string })?.value.toString()
    );

    console.log(selectedStore);
    onBusinessSelect(selectedStore || null);
  };

  return (
    <div className="w-full sm:max-w-sm sm:min-w-xs md:max-w-md md:min-w-sm">
      <DynamicSelect
        options={options}
        onChange={handleChange}
        placeholder="ค้นหาสถานที่..."
        className="text-black text-sm sm:text-base"
        isClearable
        styles={{
          control: (base) => ({
            ...base,
            minHeight: "40px",
            fontSize: "16px", // Set minimum 16px to prevent iOS zoom
            "@media (min-width: 640px)": {
              fontSize: "16px",
            },
          }),
          placeholder: (base) => ({
            ...base,
            fontSize: "16px", // Set minimum 16px to prevent iOS zoom
            "@media (min-width: 640px)": {
              fontSize: "16px",
            },
          }),
        }}
      />
    </div>
  );
}

'use client';
import { MockupLocation } from '@/app/constants';
// import Select from 'react-select';
    import dynamic from 'next/dynamic';

    const DynamicSelect = dynamic(() => import('react-select'), { ssr: false });


const options = MockupLocation.map((store) => ({
  value: store.id,
  label: store.name,
}));

export default function SearchableDropdown() {
  const handleChange = (selectedOption: unknown) => {
    console.log((selectedOption as {
  value: string,
  label: string,
})?.value);
  };

  return (
    <div className="w-[400px]">
      <DynamicSelect
        options={options}
        onChange={handleChange}
        placeholder="Select a location"
        className='text-black'
      />
    </div>
  );
}

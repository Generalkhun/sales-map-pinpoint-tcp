import MapboxMap from './component/Mapbox';

// Disable SSR for mapbox since it needs browser APIs like `window`

export default function Home() {
  return (
    <div>
       <MapboxMap/>
    </div>
  );
}

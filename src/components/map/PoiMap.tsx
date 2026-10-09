import {
  Camera,
  GeoJSONSource,
  Images,
  Layer,
  Map,
  type CameraRef,
  type GeoJSONSourceRef,
  type InitialViewState,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { StyleSheet } from 'react-native';

import { usePoiData } from '@/data/DataProvider';
import type { Poi } from '@/data/pois';
import { CATEGORIES, type Category } from '@/data/schema';
import {
  locationStore,
  mapCenterStore,
  SCANDINAVIA_CENTER,
  SCANDINAVIA_ZOOM,
  useLocationState,
} from '@/state/location';
import { CATEGORY_COLORS } from '@/theme/categories';
import { useColorSchemeName, useTheme } from '@/theme/useTheme';
import { markPerf } from '@/utils/perf';

import { MAP_STYLES } from './PoiMap.styles';

export { MAP_STYLES };

const MAP_ICONS: Record<Category, number> = {
  caravan_site: require('../../../assets/map/caravan_site.png'),
  camp_site: require('../../../assets/map/camp_site.png'),
  dump_station: require('../../../assets/map/dump_station.png'),
  water: require('../../../assets/map/water.png'),
  rest_area: require('../../../assets/map/rest_area.png'),
  lpg: require('../../../assets/map/lpg.png'),
};

const USER_ZOOM = 11;
const CLUSTER_MAX_ZOOM = 12;
/** "You are here" blue, recognisable from other map apps. */
const USER_DOT_COLOR = '#1A73E8';

export type PoiMapHandle = {
  /** Moves the camera to the device position; returns false if there is none. */
  centerOnUser: () => boolean;
};

type Props = {
  visible: readonly Category[];
  onSelectPoi: (poi: Poi) => void;
  /** Called when the background map cannot load (offline) or recovers. */
  onBaseMapStatus?: (status: 'ok' | 'failed') => void;
  ref?: Ref<PoiMapHandle>;
};

function offlineStyle(background: string): StyleSpecification {
  return {
    version: 8,
    name: 'offline',
    sources: {},
    layers: [{ id: 'background', type: 'background', paint: { 'background-color': background } }],
  };
}

export function PoiMap({ visible, onSelectPoi, onBaseMapStatus, ref }: Props) {
  const { pois, geojson } = usePoiData();
  const scheme = useColorSchemeName();
  const theme = useTheme();
  const { permission, position } = useLocationState();
  const cameraRef = useRef<CameraRef>(null);
  const sourceRefs = useRef<Partial<Record<Category, GeoJSONSourceRef | null>>>({});
  const userMovedMap = useRef(false);
  const [baseMapFailed, setBaseMapFailed] = useState(false);

  // Decided once at mount; later fixes move the camera only until the user pans.
  const [initialViewState] = useState<InitialViewState>(() => {
    const position = locationStore.get().position;
    return position
      ? { center: [position.lon, position.lat], zoom: USER_ZOOM }
      : { center: [SCANDINAVIA_CENTER.lon, SCANDINAVIA_CENTER.lat], zoom: SCANDINAVIA_ZOOM };
  });

  useImperativeHandle(ref, () => ({
    centerOnUser: () => {
      const position = locationStore.get().position;
      if (!position) return false;
      cameraRef.current?.flyTo({
        center: [position.lon, position.lat],
        zoom: USER_ZOOM,
        duration: 800,
      });
      return true;
    },
  }));

  // First GPS fix after start: move there unless the user already moved the map.
  const hasCentered = useRef(initialViewState.zoom === USER_ZOOM);
  useEffect(() => {
    if (!position || hasCentered.current || userMovedMap.current) return;
    hasCentered.current = true;
    cameraRef.current?.easeTo({
      center: [position.lon, position.lat],
      zoom: USER_ZOOM,
      duration: 600,
    });
  }, [position]);

  const handlePress = async (category: Category, features: GeoJSON.Feature[]): Promise<void> => {
    const feature = features[0];
    if (!feature || feature.geometry.type !== 'Point') return;
    const props = feature.properties ?? {};
    if (props.cluster) {
      const source = sourceRefs.current[category];
      const zoom = source
        ? await source.getClusterExpansionZoom(Number(props.cluster_id))
        : undefined;
      cameraRef.current?.easeTo({
        center: feature.geometry.coordinates as [number, number],
        zoom: Math.min((zoom ?? CLUSTER_MAX_ZOOM) + 0.5, 16),
        duration: 500,
      });
      return;
    }
    const poi = pois[Number(props.i)];
    if (poi) onSelectPoi(poi);
  };

  const failed = baseMapFailed;
  const visibleSet = new Set(visible);

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={failed ? offlineStyle(theme.background) : MAP_STYLES[scheme]}
      attribution={false}
      logo={false}
      compass
      compassPosition={{ top: 72, right: 12 }}
      touchPitch={false}
      onRegionDidChange={(event) => {
        const { center, userInteraction } = event.nativeEvent;
        if (userInteraction) userMovedMap.current = true;
        mapCenterStore.set({ lat: center[1], lon: center[0] });
      }}
      onDidFinishLoadingMap={() => {
        markPerf('map-style-loaded');
        onBaseMapStatus?.('ok');
      }}
      onDidFinishRenderingMapFully={() => markPerf('map-rendered')}
      onDidFailLoadingMap={() => {
        setBaseMapFailed(true);
        onBaseMapStatus?.('failed');
      }}>
      <Camera ref={cameraRef} initialViewState={initialViewState} minZoom={3} maxZoom={18} />
      <Images images={MAP_ICONS} />
      {CATEGORIES.map((category) => {
        const visibility = visibleSet.has(category) ? 'visible' : 'none';
        const color = CATEGORY_COLORS[category];
        return (
          <GeoJSONSource
            key={category}
            id={`pois-${category}`}
            ref={(r) => {
              sourceRefs.current[category] = r;
            }}
            data={geojson[category]}
            cluster
            clusterRadius={56}
            clusterMaxZoom={CLUSTER_MAX_ZOOM}
            onPress={(event) => void handlePress(category, event.nativeEvent.features)}>
            <Layer
              id={`cluster-${category}`}
              type="circle"
              filter={['has', 'point_count']}
              layout={{ visibility }}
              paint={{
                'circle-color': color,
                'circle-radius': ['step', ['get', 'point_count'], 14, 10, 17, 50, 21, 250, 25],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
              }}
            />
            {!failed && (
              <Layer
                id={`cluster-count-${category}`}
                type="symbol"
                filter={['has', 'point_count']}
                layout={{
                  visibility,
                  'text-field': ['get', 'point_count_abbreviated'],
                  'text-font': ['Noto Sans Bold'],
                  'text-size': 13,
                  'text-allow-overlap': true,
                  'text-ignore-placement': true,
                }}
                paint={{ 'text-color': '#FFFFFF' }}
              />
            )}
            {/* Same disc as the icon, underneath it: if a GPU/driver fails to draw symbol
                layers (seen on Android emulators), the places are still visible. */}
            <Layer
              id={`poi-dot-${category}`}
              type="circle"
              filter={['!', ['has', 'point_count']]}
              layout={{ visibility }}
              paint={{
                'circle-color': color,
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 9.3, 14, 12.5],
                'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 8, 1.4, 14, 1.8],
                'circle-stroke-color': '#FFFFFF',
              }}
            />
            <Layer
              id={`poi-${category}`}
              type="symbol"
              filter={['!', ['has', 'point_count']]}
              layout={{
                visibility,
                'icon-image': category,
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.75, 14, 1],
              }}
            />
          </GeoJSONSource>
        );
      })}
      {/* Drawn from our own expo-location fix (the one "Närmast" measures from) instead of
          MapLibre's location component, which has a separate location engine. */}
      {permission === 'granted' && position && (
        <GeoJSONSource
          id="user-location"
          data={{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [position.lon, position.lat] },
            properties: {},
          }}>
          <Layer
            id="user-location-halo"
            type="circle"
            paint={{ 'circle-radius': 18, 'circle-color': USER_DOT_COLOR, 'circle-opacity': 0.18 }}
          />
          <Layer
            id="user-location-dot"
            type="circle"
            paint={{
              'circle-radius': 8,
              'circle-color': USER_DOT_COLOR,
              'circle-stroke-width': 3,
              'circle-stroke-color': '#FFFFFF',
            }}
          />
        </GeoJSONSource>
      )}
    </Map>
  );
}

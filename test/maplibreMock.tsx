/**
 * Jest stand-in for @maplibre/maplibre-react-native (native views can't render in Jest).
 * Renders plain Views carrying the props tests care about.
 */
import { forwardRef, useImperativeHandle, type ReactNode } from 'react';
import { View } from 'react-native';

type AnyProps = Record<string, unknown> & { children?: ReactNode };

export const cameraCalls: { method: string; args: unknown }[] = [];

export const Map = ({ children, ...props }: AnyProps) => (
  <View testID="maplibre-map" {...(props as object)}>
    {children}
  </View>
);

export const Camera = forwardRef((_props: AnyProps, ref) => {
  useImperativeHandle(ref, () => ({
    flyTo: (args: unknown) => cameraCalls.push({ method: 'flyTo', args }),
    easeTo: (args: unknown) => cameraCalls.push({ method: 'easeTo', args }),
    jumpTo: (args: unknown) => cameraCalls.push({ method: 'jumpTo', args }),
  }));
  return null;
});
Camera.displayName = 'Camera';

export const GeoJSONSource = forwardRef(({ children, id }: AnyProps, ref) => {
  useImperativeHandle(ref, () => ({ getClusterExpansionZoom: async () => 10 }));
  return <View testID={String(id)}>{children}</View>;
});
GeoJSONSource.displayName = 'GeoJSONSource';

export const Layer = (props: AnyProps) => (
  <View testID={String(props.id)} accessibilityHint={JSON.stringify(props.layout ?? {})} />
);
export const Images = () => null;

import { I18nManager, StyleProp, TextStyle } from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export type FeatherIconName = keyof typeof Feather.glyphMap;
export type MaterialCommunityIconName = keyof typeof MaterialCommunityIcons.glyphMap;
export type IoniconName = keyof typeof Ionicons.glyphMap;

export type AppIconFamily = 'feather' | 'materialCommunity' | 'ionicons';

interface AppIconProps {
  family?: AppIconFamily;
  name: FeatherIconName | MaterialCommunityIconName | IoniconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  flipRTL?: boolean;
}

const ICON_COMPONENTS = {
  feather: Feather,
  materialCommunity: MaterialCommunityIcons,
  ionicons: Ionicons,
} as const;

export function AppIcon({
  family = 'feather',
  name,
  size = 24,
  color,
  style,
  flipRTL = false,
  ...props
}: AppIconProps) {
  const needsFlip = flipRTL && I18nManager.isRTL;
  const IconComponent = ICON_COMPONENTS[family];

  return (
    <IconComponent
      name={name as never}
      size={size}
      color={color}
      style={[needsFlip && { transform: [{ scaleX: -1 }] }, style]}
      {...props}
    />
  );
}

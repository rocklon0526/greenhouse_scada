export interface EquipmentConfig {
    id: string;
    name: string;
    typeId: string;
}

export interface ZoneConfig {
    id: string;
    name: string;
    equipments: EquipmentConfig[];
}

export interface SiteLayout {
    site_name: string;
    zones: ZoneConfig[];
}

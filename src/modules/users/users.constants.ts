import type { UserStatus } from './users.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

export const usersPath = '/advanced/users'
export const userEditPath = (userId: string) => `${usersPath}/${userId}/edit`
export const userGroupPermissionsPath = (groupId: string) => `${usersPath}/groups/${groupId}/permissions`
export const userSettingAddPath = (userId: string) => `${usersPath}/${userId}/settings/add`
export const userSettingEditPath = (userId: string, settingId: string) => `${usersPath}/${userId}/settings/${settingId}/edit`

/** Fields matched by fetchUsers' search filter (see users.service.ts). Groups are matched by name. */
export const searchUserFields = ['username', 'group_names'] as const

export const PASSWORD_MIN_LENGTH = 12

/**
 * No password endpoint is defined yet, so the mock service validates a password but cannot store it.
 * The UI says so instead of reporting a password as saved.
 */
export const PASSWORD_NOT_SAVED_HINT = 'Passwords are validated but not saved yet: no password endpoint is defined.'

export const userStatusOptions: { value: UserStatus; label: string }[] = (
  ['logged-out', 'available', 'available-on-demand', 'on-break', 'do not disturb'] as const
).map((value) => ({ value, label: value }))

/** User Account Status: the underlying `enabled` boolean, shown as Active / Inactive. */
export const accountStatusOptions: { value: boolean; label: string }[] = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' },
]

export const enabledOptions: { value: boolean; label: string }[] = [
  { value: true, label: 'true' },
  { value: false, label: 'false' },
]

/**
 * The Domain dropdown's "Global" entry. A user with no domain is global (the list already treats
 * domain-less users that way), so this id is only a form value: the service stores it as no domain.
 */
export const GLOBAL_DOMAIN_ID = 'global'

export const defaultStatus: UserStatus = 'available'
export const defaultTimezone = 'UTC'
export const defaultLanguage = 'en-us'

/**
 * Language options. No confirmed list exists in the repo or the Axion reference, so this is a
 * reasonable finite set (value = locale code). BACKEND CONTRACT REQUIRED: replace with the
 * platform's supported languages once known.
 */
export const languageOptions: { value: string; label: string }[] = [
  { value: 'en-us', label: 'English (US)' },
  { value: 'en-gb', label: 'English (UK)' },
  { value: 'es-es', label: 'Spanish' },
  { value: 'fr-fr', label: 'French' },
  { value: 'de-de', label: 'German' },
  { value: 'it-it', label: 'Italian' },
  { value: 'pt-pt', label: 'Portuguese (Portugal)' },
  { value: 'pt-br', label: 'Portuguese (Brazil)' },
  { value: 'nl-nl', label: 'Dutch' },
  { value: 'ru-ru', label: 'Russian' },
  { value: 'ar-eg', label: 'Arabic' },
  { value: 'hi-in', label: 'Hindi' },
  { value: 'ja-jp', label: 'Japanese' },
  { value: 'zh-cn', label: 'Chinese (Simplified)' },
]

const timezoneNames = `
Africa/Abidjan Africa/Accra Africa/Addis_Ababa Africa/Algiers Africa/Asmara Africa/Bamako Africa/Bangui
Africa/Banjul Africa/Bissau Africa/Blantyre Africa/Brazzaville Africa/Bujumbura Africa/Cairo
Africa/Casablanca Africa/Ceuta Africa/Conakry Africa/Dakar Africa/Dar_es_Salaam Africa/Djibouti
Africa/Douala Africa/El_Aaiun Africa/Freetown Africa/Gaborone Africa/Harare Africa/Johannesburg
Africa/Juba Africa/Kampala Africa/Khartoum Africa/Kigali Africa/Kinshasa Africa/Lagos Africa/Libreville
Africa/Lome Africa/Luanda Africa/Lubumbashi Africa/Lusaka Africa/Malabo Africa/Maputo Africa/Maseru
Africa/Mbabane Africa/Mogadishu Africa/Monrovia Africa/Nairobi Africa/Ndjamena Africa/Niamey
Africa/Nouakchott Africa/Ouagadougou Africa/Porto-Novo Africa/Sao_Tome Africa/Tripoli Africa/Tunis
Africa/Windhoek

America/Adak America/Anchorage America/Anguilla America/Antigua America/Araguaina
America/Argentina/Buenos_Aires America/Argentina/Catamarca America/Argentina/Cordoba
America/Argentina/Jujuy America/Argentina/La_Rioja America/Argentina/Mendoza
America/Argentina/Rio_Gallegos America/Argentina/Salta America/Argentina/San_Juan
America/Argentina/San_Luis America/Argentina/Tucuman America/Argentina/Ushuaia America/Aruba
America/Asuncion America/Atikokan America/Bahia America/Bahia_Banderas America/Barbados America/Belem
America/Belize America/Blanc-Sablon America/Boa_Vista America/Bogota America/Boise
America/Cambridge_Bay America/Campo_Grande America/Cancun America/Caracas America/Cayenne
America/Cayman America/Chicago America/Chihuahua America/Ciudad_Juarez America/Costa_Rica
America/Coyhaique America/Creston America/Cuiaba America/Curacao America/Danmarkshavn America/Dawson
America/Dawson_Creek America/Denver America/Detroit America/Dominica America/Edmonton America/Eirunepe
America/El_Salvador America/Fort_Nelson America/Fortaleza America/Glace_Bay America/Goose_Bay
America/Grand_Turk America/Grenada America/Guadeloupe America/Guatemala America/Guayaquil
America/Guyana America/Halifax America/Havana America/Hermosillo America/Indiana/Indianapolis
America/Indiana/Knox America/Indiana/Marengo America/Indiana/Petersburg America/Indiana/Tell_City
America/Indiana/Vevay America/Indiana/Vincennes America/Indiana/Winamac America/Inuvik
America/Iqaluit America/Jamaica America/Juneau America/Kentucky/Louisville America/Kentucky/Monticello
America/Kralendijk America/La_Paz America/Lima America/Los_Angeles America/Lower_Princes
America/Maceio America/Managua America/Manaus America/Marigot America/Martinique America/Matamoros
America/Mazatlan America/Menominee America/Merida America/Metlakatla America/Mexico_City
America/Miquelon America/Moncton America/Monterrey America/Montevideo America/Montserrat
America/Nassau America/New_York America/Nome America/Noronha America/North_Dakota/Beulah
America/North_Dakota/Center America/North_Dakota/New_Salem America/Nuuk America/Ojinaga
America/Panama America/Paramaribo America/Phoenix America/Port-au-Prince America/Port_of_Spain
America/Porto_Velho America/Puerto_Rico America/Punta_Arenas America/Rankin_Inlet America/Recife
America/Regina America/Resolute America/Rio_Branco America/Santarem America/Santiago
America/Santo_Domingo America/Sao_Paulo America/Scoresbysund America/Sitka America/St_Barthelemy
America/St_Johns America/St_Kitts America/St_Lucia America/St_Thomas America/St_Vincent
America/Swift_Current America/Tegucigalpa America/Thule America/Tijuana America/Toronto
America/Tortola America/Vancouver America/Whitehorse America/Winnipeg America/Yakutat

Antarctica/Casey Antarctica/Davis Antarctica/DumontDUrville Antarctica/Macquarie Antarctica/Mawson
Antarctica/McMurdo Antarctica/Palmer Antarctica/Rothera Antarctica/Syowa Antarctica/Troll
Antarctica/Vostok

Arctic/Longyearbyen

Asia/Aden Asia/Almaty Asia/Amman Asia/Anadyr Asia/Aqtau Asia/Aqtobe Asia/Ashgabat Asia/Atyrau
Asia/Baghdad Asia/Bahrain Asia/Baku Asia/Bangkok Asia/Barnaul Asia/Beirut Asia/Bishkek Asia/Brunei
Asia/Chita Asia/Colombo Asia/Damascus Asia/Dhaka Asia/Dili Asia/Dubai Asia/Dushanbe Asia/Famagusta
Asia/Gaza Asia/Hebron Asia/Ho_Chi_Minh Asia/Hong_Kong Asia/Hovd Asia/Irkutsk Asia/Jakarta
Asia/Jayapura Asia/Jerusalem Asia/Kabul Asia/Kamchatka Asia/Karachi Asia/Kathmandu Asia/Khandyga
Asia/Kolkata Asia/Krasnoyarsk Asia/Kuala_Lumpur Asia/Kuching Asia/Kuwait Asia/Macau Asia/Magadan
Asia/Makassar Asia/Manila Asia/Muscat Asia/Nicosia Asia/Novokuznetsk Asia/Novosibirsk Asia/Omsk
Asia/Oral Asia/Phnom_Penh Asia/Pontianak Asia/Pyongyang Asia/Qatar Asia/Qostanay Asia/Qyzylorda
Asia/Riyadh Asia/Sakhalin Asia/Samarkand Asia/Seoul Asia/Shanghai Asia/Singapore Asia/Srednekolymsk
Asia/Taipei Asia/Tashkent Asia/Tbilisi Asia/Tehran Asia/Thimphu Asia/Tokyo Asia/Tomsk
Asia/Ulaanbaatar Asia/Urumqi Asia/Ust-Nera Asia/Vientiane Asia/Vladivostok Asia/Yakutsk Asia/Yangon
Asia/Yekaterinburg Asia/Yerevan

Atlantic/Azores Atlantic/Bermuda Atlantic/Canary Atlantic/Cape_Verde Atlantic/Faroe Atlantic/Madeira
Atlantic/Reykjavik Atlantic/South_Georgia Atlantic/St_Helena Atlantic/Stanley

Australia/Adelaide Australia/Brisbane Australia/Broken_Hill Australia/Darwin Australia/Eucla
Australia/Hobart Australia/Lindeman Australia/Lord_Howe Australia/Melbourne Australia/Perth
Australia/Sydney

Europe/Amsterdam Europe/Andorra Europe/Astrakhan Europe/Athens Europe/Belgrade Europe/Berlin
Europe/Bratislava Europe/Brussels Europe/Bucharest Europe/Budapest Europe/Busingen Europe/Chisinau
Europe/Copenhagen Europe/Dublin Europe/Gibraltar Europe/Guernsey Europe/Helsinki Europe/Isle_of_Man
Europe/Istanbul Europe/Jersey Europe/Kaliningrad Europe/Kirov Europe/Kyiv Europe/Lisbon
Europe/Ljubljana Europe/London Europe/Luxembourg Europe/Madrid Europe/Malta Europe/Mariehamn
Europe/Minsk Europe/Monaco Europe/Moscow Europe/Oslo Europe/Paris Europe/Podgorica Europe/Prague
Europe/Riga Europe/Rome Europe/Samara Europe/San_Marino Europe/Sarajevo Europe/Saratov
Europe/Simferopol Europe/Skopje Europe/Sofia Europe/Stockholm Europe/Tallinn Europe/Tirane
Europe/Ulyanovsk Europe/Vaduz Europe/Vatican Europe/Vienna Europe/Vilnius Europe/Volgograd
Europe/Warsaw Europe/Zagreb Europe/Zurich

Indian/Antananarivo Indian/Chagos Indian/Christmas Indian/Cocos Indian/Comoro Indian/Kerguelen
Indian/Mahe Indian/Maldives Indian/Mauritius Indian/Mayotte Indian/Reunion

Pacific/Apia Pacific/Auckland Pacific/Bougainville Pacific/Chatham Pacific/Chuuk Pacific/Easter
Pacific/Efate Pacific/Fakaofo Pacific/Fiji Pacific/Funafuti Pacific/Galapagos Pacific/Gambier
Pacific/Guadalcanal Pacific/Guam Pacific/Honolulu Pacific/Kanton Pacific/Kiritimati Pacific/Kosrae
Pacific/Kwajalein Pacific/Majuro Pacific/Marquesas Pacific/Midway Pacific/Nauru Pacific/Niue
Pacific/Norfolk Pacific/Noumea Pacific/Pago_Pago Pacific/Palau Pacific/Pitcairn Pacific/Pohnpei
Pacific/Port_Moresby Pacific/Rarotonga Pacific/Saipan Pacific/Tahiti Pacific/Tarawa Pacific/Tongatapu
Pacific/Wake Pacific/Wallis

UTC
`

export const timezoneOptions: { value: string; label: string }[] = timezoneNames
  .split(/\s+/)
  .filter(Boolean)
  .map((value) => ({ value, label: value }))

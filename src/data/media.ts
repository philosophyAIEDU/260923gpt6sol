import { ADDITIONAL_ILLUSTRATIONS } from './generatedMedia';

/** NASA 사진은 원본 설명 페이지를 함께 제공해 관측 영상과 3D 모형을 구분합니다. */
export interface SpacePhoto {
  id: string;
  title: string;
  subtitle: string;
  observation: string;
  image: string;
  source: string;
  reference?: string;
  credit: string;
  focusId?: string;
  learningPoint?: string;
  kind?: 'illustration';
}

export const SPACE_PHOTOS: SpacePhoto[] = [
  {
    id: 'sun', title: '태양의 표면', subtitle: '태양 관측 위성 SDO',
    observation: '밝고 어두운 영역이 모두 보이나요? 관측 파장에 따라 태양의 모습이 달라집니다.',
    image: '/images/nasa/sun.jpg', source: 'https://science.nasa.gov/photojournal/image-of-sun-from-nasas-solar-dynamics-observatory/', credit: 'NASA / SDO',
  },
  {
    id: 'mercury', title: '수성의 지형', subtitle: 'MESSENGER·Mariner 10 합성 지도',
    observation: '둥근 충돌 구덩이를 찾아보세요. 여러 장을 이어 붙인 지도입니다.',
    image: '/images/nasa/mercury.jpg', source: 'https://science.nasa.gov/photojournal/full-global-mercury-mosaic/', credit: 'NASA / JHUAPL / USGS',
  },
  {
    id: 'venus', title: '금성의 구름', subtitle: '마리너 10호의 가시광 관측',
    observation: '두꺼운 구름 때문에 우주에서 금성 표면을 직접 볼 수 있을까요?',
    image: '/images/nasa/venus.jpg', source: 'https://science.nasa.gov/photojournal/venus-from-mariner-10/', credit: 'NASA / JPL-Caltech',
  },
  {
    id: 'earth', title: '푸른 지구', subtitle: '아폴로 17호가 촬영한 지구',
    observation: '바다, 구름, 대륙 중 무엇이 가장 먼저 눈에 들어오나요?',
    image: '/images/nasa/earth.jpg', source: 'https://science.nasa.gov/resource/the-blue-marble/', credit: 'NASA / Apollo 17',
  },
  {
    id: 'mars', title: '화성의 표면', subtitle: '허블 우주망원경 관측',
    observation: '붉은 지역과 밝은 지역을 비교해 보세요.',
    image: '/images/nasa/mars.jpg', source: 'https://images.nasa.gov/details/PIA03154', credit: 'NASA / Hubble',
  },
  {
    id: 'jupiter', title: '목성의 폭풍', subtitle: '허블 우주망원경 관측',
    observation: '띠가 나란히 보이나요? 목성은 단단한 표면이 없는 가스 행성입니다.',
    image: '/images/nasa/jupiter.jpg', source: 'https://images.nasa.gov/details/PIA01262', credit: 'NASA / Hubble',
  },
  {
    id: 'saturn', title: '토성과 고리', subtitle: '허블 우주망원경 관측',
    observation: '고리가 행성 표면에 붙어 있지 않다는 것을 3D 모형에서도 확인해 보세요.',
    image: '/images/nasa/saturn.jpg', source: 'https://images.nasa.gov/details/PIA05982', credit: 'NASA / Hubble',
  },
  {
    id: 'uranus', title: '푸른 천왕성', subtitle: '보이저 2호 관측',
    observation: '대기의 메탄이 붉은빛을 흡수해 푸른빛 계열로 보여요.',
    image: '/images/nasa/uranus.jpg', source: 'https://science.nasa.gov/resource/uranus-as-seen-by-nasas-voyager-2/', credit: 'NASA / JPL-Caltech',
  },
  {
    id: 'neptune', title: '해왕성의 대기', subtitle: '보이저 2호 관측 · 가시광 색',
    observation: '구름과 짙은 부분을 찾아보세요. 대기는 계속 움직입니다.',
    image: '/images/nasa/neptune.jpg', source: 'https://science.nasa.gov/photojournal/neptune-true-color-of-clouds/', credit: 'NASA / JPL-Caltech',
  },
  {
    id: 'moon', title: '달의 앞면', subtitle: '달 정찰 궤도선 LRO 촬영 자료',
    observation: '어두운 바다 지역과 밝은 충돌 구덩이를 비교해 보세요.',
    image: '/images/nasa/moon.jpg', source: 'https://science.nasa.gov/resource/lunar-near-side/', credit: 'NASA / LRO',
  },
  {
    id: 'galaxy', title: '안드로메다은하', subtitle: '자외선 관측 · 태양계 바깥',
    observation: '태양계는 하나의 은하 안에 있습니다. 이 사진은 다른 은하의 모습입니다.',
    image: '/images/nasa/galaxy.jpg', source: 'https://images.nasa.gov/details/PIA04921', credit: 'NASA / GALEX',
  },
  {
    id: 'moon-far-side', focusId: 'moon', title: '달의 뒷면', subtitle: 'LRO 탐사선 영상으로 만든 모자이크',
    observation: '앞면 사진과 비교해 어두운 달의 바다 지역이 얼마나 보이는지 찾아보세요.',
    learningPoint: '달은 자전과 공전 주기가 비슷해 지구에서는 늘 거의 같은 면을 봅니다.',
    image: '/images/nasa/moon-far-side.jpg', source: 'https://science.nasa.gov/resource/lunar-far-side/', credit: 'NASA / Goddard / Arizona State University',
  },
  {
    id: 'mars-panorama', focusId: 'mars', title: '화성의 지평선', subtitle: '퍼서비어런스 탐사차의 파노라마',
    observation: '궤도에서 본 화성 사진과 비교해 지표의 질감과 지평선을 살펴보세요.',
    image: '/images/nasa/mars-panorama.jpg', source: 'https://science.nasa.gov/photojournal/perseverances-office-on-mars/', credit: 'NASA / JPL-Caltech / ASU / MSSS',
  },
  {
    id: 'jupiter-red-spot', focusId: 'jupiter', title: '목성의 대적점', subtitle: '주노 탐사선 · 색을 강조한 영상',
    observation: '대적점 주변의 소용돌이와 구름 띠가 어떻게 이어지는지 따라가 보세요.',
    learningPoint: '대적점은 목성 대기에서 오랫동안 지속된 거대한 폭풍입니다. 색은 세부를 드러내도록 강조했습니다.',
    image: '/images/nasa/jupiter-red-spot.jpg', source: 'https://science.nasa.gov/photojournal/jupiters-great-red-spot-revealed/', credit: 'NASA / JPL-Caltech / SwRI / MSSS / Kevin M. Gill (CC BY)',
  },
  {
    id: 'saturn-rings-detail', focusId: 'saturn', title: '토성 고리의 틈', subtitle: '카시니 탐사선의 가시광 관측',
    observation: '고리 사이의 어두운 틈과 밝기가 다른 여러 띠를 찾아보세요.',
    learningPoint: '고리는 하나의 단단한 원반이 아니라 수많은 얼음과 암석 조각으로 이루어져 있습니다.',
    image: '/images/nasa/saturn-rings-detail.jpg', source: 'https://science.nasa.gov/photojournal/scanning-the-rings/', credit: 'NASA / JPL / Space Science Institute',
  },
  {
    id: 'pillars-of-creation', title: '창조의 기둥', subtitle: '제임스 웹 우주망원경 근적외선 합성 영상',
    observation: '가스와 먼지 기둥 주변의 밝은 어린 별들을 찾아보세요.',
    learningPoint: '적외선 관측 데이터를 사람이 볼 수 있는 색에 대응해 만든 영상입니다.',
    image: '/images/nasa/pillars-of-creation.jpg', source: 'https://science.nasa.gov/asset/webb/pillars-of-creation-nircam-image/', credit: 'NASA / ESA / CSA / STScI',
  },
  {
    id: 'solar-eclipse', focusId: 'sun', title: '개기일식: 예측과 관측', subtitle: '2024년 개기일식 · NASA의 코로나 비교 영상',
    observation: '두 화면의 코로나 구조는 어디가 비슷하고 어디가 다른가요?',
    learningPoint: '한쪽은 모델의 예측이고 다른 쪽은 실제 촬영 사진입니다. 전체가 한 장의 사진은 아닙니다.',
    image: '/images/nasa/solar-eclipse.jpg', source: 'https://science.nasa.gov/image-article/centers-and-facilities/goddard/2024-total-solar-eclipse-prediction-vs-reality/', credit: 'NASA / Keegan Barber',
  },
  {
    id: 'earth-aurora', focusId: 'earth', title: '지구 위의 오로라', subtitle: '국제우주정거장에서 촬영한 오로라',
    observation: '초록빛 커튼과 지구의 휘어진 가장자리를 찾아보세요.',
    learningPoint: '태양에서 온 하전 입자가 지구 자기장과 대기의 영향을 받아 빛을 냅니다.',
    image: '/images/nasa/earth-aurora.jpg', source: 'https://science.nasa.gov/earth/earth-observatory/aurora-australis-observed-from-the-international-space-station-44348/', credit: 'NASA / ISS Crew Earth Observations',
  },
];

/** 관측 사진과 혼동하지 않도록 생성 이미지는 별도 목록과 표식을 사용합니다. */
export const CONCEPT_ILLUSTRATIONS: SpacePhoto[] = [
  {
    id: 'day-night-concept', focusId: 'earth', kind: 'illustration', title: '지구의 낮과 밤', subtitle: '학습용 생성 일러스트 · 실제 촬영 사진 아님',
    observation: '햇빛을 받는 쪽과 어두운 쪽의 경계를 찾아보세요. 지구가 자전하면 경계가 어떻게 달라질까요?',
    learningPoint: '낮과 밤은 지구가 자전하면서 각 지역이 태양빛을 받거나 받지 않기 때문에 생깁니다. 표현은 개념 이해를 위한 것입니다.',
    image: '/images/illustrations/earth-day-night.jpg', source: '', reference: 'https://science.nasa.gov/earth/facts/', credit: 'OpenAI ImageGen · 교육용 개념 일러스트',
  },
  {
    id: 'planet-types-concept', focusId: 'jupiter', kind: 'illustration', title: '암석 행성과 가스 행성', subtitle: '학습용 생성 일러스트 · 실제 크기 비율 아님',
    observation: '왼쪽 천체의 충돌 구덩이와 오른쪽 천체의 구름 띠를 비교해 보세요.',
    learningPoint: '암석 행성에는 단단한 표면이 있고, 목성과 같은 거대 가스 행성에서 보이는 무늬는 대기의 구름입니다. 두 천체는 실제 비율로 그리지 않았습니다.',
    image: '/images/illustrations/rocky-gas-planets.jpg', source: '', reference: 'https://science.nasa.gov/solar-system/solar-system-facts/', credit: 'OpenAI ImageGen · 교육용 개념 일러스트',
  },
  ...ADDITIONAL_ILLUSTRATIONS,
];

export const getSpacePhoto = (id: string): SpacePhoto | undefined => SPACE_PHOTOS.find((photo) => photo.id === id);

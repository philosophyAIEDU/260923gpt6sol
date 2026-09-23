/** NASA 사진은 원본 설명 페이지를 함께 제공해 관측 영상과 3D 모형을 구분합니다. */
export interface SpacePhoto {
  id: string;
  title: string;
  subtitle: string;
  observation: string;
  image: string;
  source: string;
  credit: string;
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
];

export const getSpacePhoto = (id: string): SpacePhoto | undefined => SPACE_PHOTOS.find((photo) => photo.id === id);

import type { SpacePhoto } from './media';

type Concept = Pick<SpacePhoto, 'id' | 'title' | 'observation' | 'learningPoint' | 'reference' | 'focusId'>;

/** NASA 학습 자료에 근거한 주제별 재현. 그림의 지형·시점·색은 관측 원본이 아닙니다. */
const concepts: Concept[] = [
  { id: 'mercury-craters', focusId: 'mercury', title: '수성의 충돌 구덩이', observation: '서로 겹친 충돌 구덩이와 그 그림자를 찾아보세요.', learningPoint: '수성은 두꺼운 대기가 없어 오래된 충돌 지형이 잘 보입니다. 특정 지역을 재현한 지도가 아닙니다.', reference: 'https://science.nasa.gov/mercury/facts/' },
  { id: 'venus-clouds', focusId: 'venus', title: '구름에 가려진 금성', observation: '행성 전체를 덮은 밝은 구름을 살펴보세요. 지표가 보이나요?', learningPoint: '금성의 두꺼운 구름층은 가시광으로 표면을 보기 어렵게 합니다. 그림의 소용돌이 모양은 특정 날짜의 관측이 아닙니다.', reference: 'https://science.nasa.gov/venus/facts/' },
  { id: 'mars-delta', focusId: 'mars', title: '화성의 고대 삼각주', observation: '암석층과 마른 하천처럼 보이는 지형을 찾아보세요.', learningPoint: '화성 제제로 분화구에는 과거 물이 흘러 형성한 삼각주 퇴적물이 있습니다. 그림은 실제 장소의 정확한 지도가 아닙니다.', reference: 'https://science.nasa.gov/mission/mars-2020-perseverance/science/' },
  { id: 'jupiter-bands', focusId: 'jupiter', title: '목성의 구름 띠', observation: '나란한 띠 사이에 있는 타원형 폭풍을 찾아보세요.', learningPoint: '목성의 무늬는 고체 표면이 아니라 움직이는 대기의 구름과 폭풍입니다. 구름 배치는 시간에 따라 달라집니다.', reference: 'https://science.nasa.gov/jupiter/facts/' },
  { id: 'saturn-rings', focusId: 'saturn', title: '토성과 고리의 구조', observation: '고리 안의 어두운 틈과 행성에 드리운 그림자를 찾아보세요.', learningPoint: '고리는 단단한 판이 아니라 수많은 얼음과 암석 조각으로 이루어집니다. 개별 조각은 이 거리에서 분간되지 않습니다.', reference: 'https://science.nasa.gov/saturn/facts/' },
  { id: 'uranus-tilt', focusId: 'uranus', title: '기울어진 천왕성', observation: '행성의 옅은 청록색과 가느다란 고리를 살펴보세요.', learningPoint: '천왕성의 자전축은 공전면에 대해 크게 기울어져 있습니다. 한 장의 그림만으로 실제 기울기 각도를 측정할 수는 없습니다.', reference: 'https://science.nasa.gov/uranus/facts/' },
  { id: 'neptune-clouds', focusId: 'neptune', title: '해왕성의 대기', observation: '희미한 밝은 구름과 어두운 대기 무늬를 찾아보세요.', learningPoint: '해왕성의 구름과 폭풍은 시간이 지나며 달라집니다. 이 그림의 파란색은 데이터에 맞춘 정밀 색 재현이 아닙니다.', reference: 'https://science.nasa.gov/neptune/facts/' },
  { id: 'moon-regolith', focusId: 'moon', title: '달의 충돌 지형', observation: '밝은 충돌 구덩이와 어두운 달의 바다를 비교해 보세요.', learningPoint: '달에는 지구처럼 두꺼운 대기가 없어 그림자가 선명합니다. 특정 달 표면의 실제 촬영 장면은 아닙니다.', reference: 'https://science.nasa.gov/moon/facts/' },
  { id: 'earth-aurora-concept', focusId: 'earth', title: '극지방의 오로라', observation: '하늘에 펼쳐진 빛의 띠와 지평선을 살펴보세요.', learningPoint: '태양에서 온 하전 입자가 지구 자기장과 대기와 상호작용하며 빛을 낼 수 있습니다. 모양과 색은 매 순간 달라집니다.', reference: 'https://science.nasa.gov/earth/facts/' },
  { id: 'solar-eclipse-concept', focusId: 'sun', title: '개기일식과 코로나', observation: '달이 가린 태양 둘레에 나타나는 희미한 빛을 살펴보세요.', learningPoint: '개기일식 때 달이 태양의 밝은 표면을 가리면 코로나가 보입니다. 직접 태양을 관찰할 때는 적절한 안전 장비가 필요합니다.', reference: 'https://science.nasa.gov/eclipses/' },
  { id: 'comet-tails', title: '혜성의 두 꼬리', observation: '휘어진 먼지 꼬리와 더 곧은 이온 꼬리를 구분해 보세요.', learningPoint: '두 꼬리는 대체로 태양의 반대편으로 뻗지만 휘는 정도와 방향이 다를 수 있습니다. 꼬리 길이는 실측 비율이 아닙니다.', reference: 'https://science.nasa.gov/solar-system/comets/facts/' },
  { id: 'asteroid-rubble', title: '돌무더기 소행성', observation: '서로 다른 크기의 바위가 모인 불규칙한 모양을 찾아보세요.', learningPoint: '베누처럼 중력으로 느슨하게 뭉친 소행성도 있습니다. 이 그림은 베누의 실제 지형이나 표본을 재현하지 않았습니다.', reference: 'https://science.nasa.gov/solar-system/asteroids/101955-bennu/facts/' },
  { id: 'europa-ice', title: '유로파의 얼음 지각', observation: '밝은 얼음 표면에 길게 교차하는 균열을 찾아보세요.', learningPoint: '목성의 위성 유로파는 얼음 지각 아래 바다가 있을 가능성이 높습니다. 그림에는 보이지 않는 바다를 지표의 열린 물로 그리지 않았습니다.', reference: 'https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/' },
  { id: 'io-volcano', title: '이오의 화산 활동', observation: '화산 분출과 표면의 다양한 색을 살펴보세요.', learningPoint: '이오는 태양계에서 화산 활동이 가장 활발한 천체 중 하나입니다. 분출 위치와 색은 실제 관측 기록을 재현하지 않았습니다.', reference: 'https://science.nasa.gov/jupiter/jupiter-moons/io/facts/' },
  { id: 'enceladus-plume', title: '엔셀라두스의 얼음 분출', observation: '위성의 남극 부근에서 우주로 뻗은 가는 분출 기둥을 찾아보세요.', learningPoint: '카시니는 엔셀라두스의 남극 균열에서 얼음 입자와 수증기가 나오는 것을 관측했습니다. 분출 위치의 세부 모양은 재현입니다.', reference: 'https://science.nasa.gov/saturn/moons/enceladus/' },
  { id: 'titan-lake', title: '타이탄의 메탄 호수', observation: '탁한 주황빛 대기와 어두운 액체 호수의 경계를 찾아보세요.', learningPoint: '타이탄의 호수는 물이 아니라 액체 메탄과 에탄으로 이루어져 있습니다. 그림의 기상과 해안선은 실제 지도가 아닙니다.', reference: 'https://science.nasa.gov/saturn/moons/titan/facts/' },
  { id: 'stellar-nursery', title: '별이 태어나는 성운', observation: '가스와 먼지 구름 사이의 밝은 젊은 별들을 찾아보세요.', learningPoint: '조밀한 가스와 먼지 속에서 별이 형성됩니다. 그림의 색은 실제 사람 눈으로 보는 색과 다를 수 있습니다.', reference: 'https://science.nasa.gov/mission/hubble/science/science-themes/' },
  { id: 'protoplanetary-disk', title: '원시행성계 원반', observation: '어린 별을 둘러싼 평평한 먼지·가스 원반을 찾아보세요.', learningPoint: '별 주위의 가스와 먼지 원반에서 행성이 형성될 수 있습니다. 원반의 띠와 간격은 특정 계의 측정값이 아닙니다.', reference: 'https://science.nasa.gov/asset/hubble/planetary-systems-in-the-making-dust-and-gas-disks-around-young-stars-in-orion-nebula/' },
  { id: 'spiral-galaxy', title: '나선은하의 팔', observation: '은하 중심에서 뻗은 나선팔과 어두운 먼지 띠를 찾아보세요.', learningPoint: '나선팔에는 별, 가스, 먼지가 모여 있으며 별이 태어나는 영역이 있습니다. 실존 은하의 원본 사진은 아닙니다.', reference: 'https://science.nasa.gov/mission/hubble/science/universe-uncovered/hubble-galaxies/' },
  { id: 'sun-granulation', focusId: 'sun', title: '태양의 광구', observation: '표면의 작은 알갱이 무늬와 어두운 흑점을 비교해 보세요.', learningPoint: '광구의 알갱이 무늬는 대류와 관련되고 흑점은 주변보다 상대적으로 어두운 영역입니다. 가까이서 본 사진으로 오해하지 마세요.', reference: 'https://science.nasa.gov/sun/facts/' },
];

export const ADDITIONAL_ILLUSTRATIONS: SpacePhoto[] = concepts.map((concept) => ({
  ...concept,
  kind: 'illustration',
  subtitle: '과학 자료를 참고한 AI 재현 · 실제 관측 사진 아님',
  image: `/images/illustrations/${concept.id}.jpg`,
  source: '',
  credit: 'OpenAI ImageGen · 생성형 AI로 그린 그림',
}));

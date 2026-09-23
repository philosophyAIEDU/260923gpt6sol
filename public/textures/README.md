# 커스텀 텍스처 폴더

이 폴더에 등장방형(equirectangular, 2:1) 이미지를 두고 `src/data/planets.json`의
`texture.map` / `texture.normalMap`에 `textures/파일명.jpg` 형식으로 경로를 지정하면 이미지 텍스처가 사용됩니다.

경로가 `null`이거나 로딩에 실패하면 자동으로 절차적(procedural) 텍스처로 대체됩니다.

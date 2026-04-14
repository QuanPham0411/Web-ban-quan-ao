export const seasonTags = ['Xuân', 'Hè', 'Thu', 'Đông', 'Premium'];
export const sizeTags = ['Size S - XL', 'Size M - 2XL', 'Size Free size', 'Size 90 - 140', 'Size tiêu chuẩn'];
export const stockTags = ['Còn hàng', 'Mới lên kệ', 'Bán chạy', 'Sắp hết hàng', 'Sắp cháy hàng'];

const publicAsset = (fileName) => `/${encodeURIComponent(fileName)}`;

export const categoryConfigs = [
  {
    key: 'women',
    label: 'Nữ',
    count: 50,
    priceStart: 245000,
    description: 'Đầm, váy, áo kiểu và set đồ nữ đang được mua nhiều.',
    items: [
      'Đầm midi hoa nhí',
      'Áo kiểu cổ vuông',
      'Chân váy xếp ly',
      'Blazer nữ thanh lịch',
      'Quần culottes nữ',
      'Jumpsuit nữ hiện đại',
      'Áo cardigan mỏng',
      'Set bộ công sở nữ',
      'Áo sơ mi lụa nữ',
      'Váy maxi dự tiệc',
    ],
    itemImages: {
      'Đầm midi hoa nhí': publicAsset('Váy maxi dự tiệc Xuân.jpg'),
      'Áo kiểu cổ vuông': publicAsset('áo kiểu cổ vuông.jpg'),
      'Chân váy xếp ly': publicAsset('Cach-phoi-do-voi-chan-vay-xep-ly-dai.jpg'),
      'Blazer nữ thanh lịch': publicAsset('blazer nữ thanh lịch'),
      'Quần culottes nữ': publicAsset('Quần culottes nữ.jpg'),
      'Jumpsuit nữ hiện đại': publicAsset('Jumpsuit nữ hiện đại.jpg'),
      'Áo cardigan mỏng': publicAsset('Áo cardigan mỏng.jpg'),
      'Set bộ công sở nữ': publicAsset('Set bộ công sở nữ.jpg'),
      'Áo sơ mi lụa nữ': publicAsset('Áo sơ mi lụa nữ Xuân.jpg'),
      'Váy maxi dự tiệc': publicAsset('Váy maxi dự tiệc Xuân.jpg'),
    },
  },
  {
    key: 'men',
    label: 'Nam',
    count: 50,
    priceStart: 219000,
    description: 'Áo sơ mi, polo, jeans, kaki và đồ nam basic dễ mặc.',
    items: [
      'Áo thun nam premium',
      'Áo polo nam',
      'Áo sơ mi oxford',
      'Quần jean nam slim fit',
      'Quần kaki nam',
      'Áo khoác bomber nam',
      'Set thể thao nam',
      'Quần short nam',
      'Áo len nam mỏng',
      'Vest nam trẻ trung',
    ],
    itemImages: {
      'Áo thun nam premium': publicAsset('Áo thun nam premium Xuân.jpg'),
      'Áo polo nam': publicAsset('Áo polo nam Xuân.jpg'),
      'Áo sơ mi oxford': publicAsset('Áo sơ mi oxford Xuân.jpg'),
      'Quần jean nam slim fit': publicAsset('Quần jean nam slim fit Xuân.jpg'),
      'Quần kaki nam': publicAsset('Quần kaki nam Xuân'),
      'Áo khoác bomber nam': publicAsset('Áo khoác bomber nam Xuân.jpg'),
      'Set thể thao nam': publicAsset('Set thể thao nam Xuân.jpg'),
      'Quần short nam': publicAsset('Quần short nam Xuân.jpg'),
      'Áo len nam mỏng': publicAsset('Áo len nam mỏng Xuân'),
      'Vest nam trẻ trung': publicAsset('Vest nam trẻ trung Xuân'),
    },
  },
  {
    key: 'kids',
    label: 'Trẻ em',
    count: 50,
    priceStart: 149000,
    description: 'Trang phục vui tươi cho bé trai, bé gái và đồ mặc nhà.',
    items: [
      'Áo thun bé trai',
      'Đầm bé gái',
      'Set đồ đi học',
      'Quần jogger trẻ em',
      'Pijama trẻ em',
      'Áo khoác kids',
      'Đầm công chúa bé gái',
      'Quần short trẻ em',
      'Áo len trẻ em',
      'Set năng động cuối tuần',
    ],
    itemImages: {
      'Áo thun bé trai': publicAsset('Áo thun bé trai Xuân.jpg'),
      'Đầm bé gái': publicAsset('Đầm bé gái Xuân.jpg'),
      'Set đồ đi học': publicAsset('Set đồ đi học Xuân.jpg'),
      'Quần jogger trẻ em': publicAsset('Quần jogger trẻ em Xuân.jpg'),
      'Pijama trẻ em': publicAsset('Pijama trẻ em Xuân.jpg'),
      'Áo khoác kids': publicAsset('Áo khoác kids Xuân.jpg'),
      'Đầm công chúa bé gái': publicAsset('Đầm công chúa bé gái Xuân.jpg'),
      'Quần short trẻ em': publicAsset('Quần short trẻ em Xuân.jpg'),
      'Áo len trẻ em': publicAsset('Áo len trẻ em Xuân.jpg'),
      'Set năng động cuối tuần': publicAsset('Set năng động cuối tuần Xuân'),
    },
  },
  {
    key: 'intimates',
    label: 'Đồ lót & mặc nhà',
    count: 50,
    priceStart: 119000,
    description: 'Đồ lót, đồ mặc nhà, đồ giữ nhiệt và phụ kiện mềm mại.',
    items: [
      'Áo bra cotton',
      'Quần lót su mềm',
      'Bộ đồ lót ren nhẹ',
      'Áo lót thể thao',
      'Quần lót nữ seamless',
      'Áo lót không gọng',
      'Bộ mặc nhà cotton',
      'Đồ ngủ satin',
      'Áo giữ nhiệt mỏng',
      'Quần gen nhẹ',
    ],
    itemImages: {
      'Áo bra cotton': publicAsset('Áo bra cotton Xuân.jpg'),
      'Quần lót su mềm': publicAsset('Quần lót su mềm Xuân.jpg'),
      'Bộ đồ lót ren nhẹ': publicAsset('Bộ đồ lót ren nhẹ Xuân.jpg'),
      'Áo lót thể thao': publicAsset('Áo lót thể thao Xuân.jpg'),
      'Quần lót nữ seamless': publicAsset('Quần lót nữ seamless Xuân.jpg'),
      'Áo lót không gọng': publicAsset('Áo lót không gọng Xuân'),
      'Bộ mặc nhà cotton': publicAsset('Bộ mặc nhà cotton Xuân.jpg'),
      'Đồ ngủ satin': publicAsset('Đồ ngủ satin Xuân.jpg'),
      'Áo giữ nhiệt mỏng': publicAsset('Áo giữ nhiệt mỏng Xuân'),
      'Quần gen nhẹ': publicAsset('Quần gen nhẹ Xuân.jpg'),
    },
  },
];

export const catalogProducts = categoryConfigs.flatMap((category, categoryIndex) =>
  Array.from({ length: category.count }, (_, index) => {
    const itemName = category.items[index % category.items.length];
    const seasonTag = seasonTags[Math.floor(index / category.items.length)];
    const price = category.priceStart + index * 12000 + categoryIndex * 9000;

    return {
      id: `${category.key}-${index + 1}`,
      categoryKey: category.key,
      categoryLabel: category.label,
      name: `${itemName} ${seasonTag}`,
      price: price.toLocaleString('vi-VN'),
      description: `${category.description} Form dễ mặc, chất liệu êm và phù hợp dùng hằng ngày.`,
      image: category.itemImages[itemName],
      size: sizeTags[index % sizeTags.length],
      stockLabel: stockTags[(index + categoryIndex) % stockTags.length],
    };
  }),
);

const normalizeSearchValue = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getSearchParts = (product) => {
  const name = normalizeSearchValue(product.name);
  const category = normalizeSearchValue(`${product.categoryLabel} ${product.categoryKey}`);
  const description = normalizeSearchValue(product.description);
  const metadata = normalizeSearchValue(`${product.size} ${product.stockLabel} ${product.id}`);

  return {
    name,
    category,
    description,
    metadata,
    combined: [name, category, description, metadata].filter(Boolean).join(' '),
  };
};

const getProductSearchScore = (product, query) => {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return 0;
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const searchable = getSearchParts(product);
  let score = 0;

  if (searchable.name.includes(normalizedQuery)) {
    score += 12;
  }

  if (searchable.category.includes(normalizedQuery)) {
    score += 8;
  }

  if (searchable.description.includes(normalizedQuery)) {
    score += 5;
  }

  const matchedTokens = tokens.every((token) => {
    if (searchable.name.includes(token)) {
      score += 4;
      return true;
    }

    if (searchable.category.includes(token)) {
      score += 3;
      return true;
    }

    if (searchable.description.includes(token)) {
      score += 2;
      return true;
    }

    if (searchable.metadata.includes(token)) {
      score += 1;
      return true;
    }

    return false;
  });

  return matchedTokens ? score : -1;
};

export const filterProductsBySearch = (products, query) => {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return products;
  }

  return [...products]
    .map((product) => ({
      product,
      score: getProductSearchScore(product, normalizedQuery),
    }))
    .filter(({ score }) => score >= 0)
    .sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name, 'vi'))
    .map(({ product }) => product);
};

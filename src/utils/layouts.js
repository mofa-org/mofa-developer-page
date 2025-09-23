// 布局算法工具

// 流体网格布局 - Pinterest瀑布流风格
export function assignFluidLayouts(links) {
  const colors = ["coral", "mint", "lavender", "peach", "sky", "sage", "rose", "lemon"];
  const heights = ["compact", "normal", "tall"]; // 紧凑、正常、高
  
  return links.map((link, index) => {
    let height;
    // 自然的高度分布：50% normal, 30% compact, 20% tall
    const rand = (index * 13 + 7) % 10; 
    if (rand < 5) height = "normal";
    else if (rand < 8) height = "compact"; 
    else height = "tall";
    
    return {
      ...link,
      fluidHeight: height,
      fluidColor: colors[index % colors.length]
    };
  });
}
import { PlacedCard, CardData } from "../types";
import { GRID_DEFINITIONS } from "../constants";
import { UserInfo } from "../components/UserInfoDialog";
import { callDecisionInterpret } from "./decisionApiClient";

const getCardDetails = (placedCards: PlacedCard[], allCards: CardData[]) => {
  return placedCards.map(p => {
    const card = allCards.find(c => c.id === p.cardId);
    const gridDef = GRID_DEFINITIONS[p.gridIndex];

    const isUpright = p.isFaceUp;
    const cardMeaning = isUpright ? card?.uprightMeaning : card?.reversedMeaning;

    return {
      cardName: card?.name || 'Unknown',
      element: card?.element || 'Unknown',
      orientation: isUpright ? "正位 (Upright)" : "逆位 (Reversed)",
      cardMeaning: cardMeaning || "暂无详解",
      gridPosition: {
        index: p.gridIndex,
        name: gridDef?.name || "Unknown Position",
        timeSpace: gridDef?.timeSpace,
        focus: gridDef?.focus,
        source: gridDef?.source,
        interpretationLogic: {
          positive: gridDef?.positiveMeaning,
          negative: gridDef?.negativeMeaning
        }
      }
    };
  });
};

export const interpretSpread = async (
  placedCards: PlacedCard[],
  allCards: CardData[],
  userInfo?: UserInfo,
  promptVersion?: string,
  onProgress?: (chunk: string) => void
): Promise<{ interpretation: string; pointsRemaining: number }> => {
  // 构建完整的卡牌上下文
  const cardContext = getCardDetails(placedCards, allCards);

    // 准备请求数据
    const requestData = {
      cardContext,  // 发送完整的卡牌上下文
      userInfo: userInfo ? {
        gender: userInfo.gender,
        age: userInfo.age,
        topic: userInfo.topic,
      } : undefined,
      promptVersion,  // 传递 prompt 版本（对比调试用）
    };

  const response = await callDecisionInterpret(requestData, (chunk) => {
    if (onProgress) onProgress(chunk);
  });

  return {
    interpretation: response.interpretation || "迷雾太重，暂时无法看清。请稍后再试。",
    pointsRemaining: response.pointsRemaining,
  };
};

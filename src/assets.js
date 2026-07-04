import { extractAssetSeeds } from "./core.js";
import { publicAssetSeedRecords } from "./public-asset-seeds.js";

export const localAssetRecords = publicAssetSeedRecords.map((record, index) => ({
  ...record,
  category: record.category || classifyAsset(record.path),
  score: Number(record.score ?? 100 - Math.min(index, 90)),
}));

export const localAssetSeeds = extractAssetSeeds(localAssetRecords);

function classifyAsset(path) {
  if (/SKILL\.md|skill\.json/i.test(path)) return "skill";
  if (/character|人物|小传|星轨人生/i.test(path)) return "character";
  if (/story|故事|剧本|screenplay|script/i.test(path)) return "story";
  if (/world|世界观|worldview/i.test(path)) return "worldbuilding";
  if (/分镜|storyboard/i.test(path)) return "storyboard";
  if (/pdf|docx/i.test(path)) return "book";
  return "project";
}

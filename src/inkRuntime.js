import { Story } from "inkjs";

export function runCompiledInkStory(storyJson, choices = []) {
  const story = new Story(storyJson);
  for (const choiceIndex of choices) {
    drainStoryText(story);
    story.ChooseChoiceIndex(choiceIndex);
  }
  return readStoryState(story);
}

function readStoryState(story) {
  return {
    text: drainStoryText(story).trim(),
    choices: story.currentChoices.map((choice, index) => ({
      index,
      text: choice.text,
    })),
  };
}

function drainStoryText(story) {
  let text = "";
  while (story.canContinue) text += story.Continue();
  return text;
}

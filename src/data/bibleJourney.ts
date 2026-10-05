export type JourneyPeriod = {
  id: string;
  title: string;
  overview: string;
  references: string[];
};

export const bibleJourney: JourneyPeriod[] = [
  {
    id: "a-world-awakened",
    title: "A World Awakened",
    overview:
      "The Bible opens with a generous vision of creation: a world called good, entrusted to human care, and still held by its Creator when trust breaks.",
    references: ["Genesis 1:1-5", "Genesis 3:8-15"],
  },
  {
    id: "a-promise-takes-root",
    title: "A Promise Takes Root",
    overview:
      "One family is invited to set out in faith. Through blessing, struggle, and generations, the promise widens beyond its first home.",
    references: ["Genesis 12:1-9", "Genesis 15:1-6"],
  },
  {
    id: "freedom-and-belonging",
    title: "Freedom and Belonging",
    overview:
      "A people are led out of oppression and taught a way of life shaped by worship, justice, and care for one another.",
    references: ["Exodus 3:1-12", "Exodus 19:3-8"],
  },
  {
    id: "a-kingdom-under-question",
    title: "A Kingdom Under Question",
    overview:
      "Israel's kingship carries both hope and danger. The Scriptures measure leadership by faithfulness and concern for the vulnerable.",
    references: ["2 Samuel 7:8-16", "Psalm 72:1-7"],
  },
  {
    id: "voices-for-the-road-home",
    title: "Voices for the Road Home",
    overview:
      "Prophets speak honestly about injustice and loss, while holding open the possibility of return, healing, and a renewed heart.",
    references: ["Isaiah 40:1-11", "Jeremiah 31:31-34"],
  },
  {
    id: "good-news-in-a-small-town",
    title: "Good News in a Small Town",
    overview:
      "In Jesus, God's promises meet ordinary lives. His words and actions announce release, welcome, and a different picture of power.",
    references: ["Luke 1:26-38", "Luke 4:16-21"],
  },
  {
    id: "love-given-to-the-end",
    title: "Love Given to the End",
    overview:
      "At the table and at the cross, Jesus gives himself in love. The disciples face the cost of this way before they can see what follows.",
    references: ["Mark 14:22-25", "Mark 15:33-39"],
  },
  {
    id: "morning-beyond-the-stone",
    title: "Morning Beyond the Stone",
    overview:
      "The resurrection turns grief into witness. The first communities learn to read their Scriptures in light of a living hope.",
    references: ["John 20:1-18", "Acts 2:22-32"],
  },
  {
    id: "a-welcome-without-borders",
    title: "A Welcome Without Borders",
    overview:
      "The good news crosses familiar boundaries. Disagreement and discernment help the early church recognize God's welcome in new places.",
    references: ["Acts 10:34-48", "Acts 15:6-11"],
  },
  {
    id: "learning-to-be-one-body",
    title: "Learning to Be One Body",
    overview:
      "Letters help scattered communities practice a shared life: receiving grace, bearing one another's burdens, and honoring different gifts.",
    references: ["Romans 8:18-30", "1 Corinthians 12:12-27"],
  },
  {
    id: "a-future-worth-living-toward",
    title: "A Future Worth Living Toward",
    overview:
      "Visions of a healed creation offer courage in difficult times and invite readers to live now as people shaped by God's promised renewal.",
    references: ["Revelation 21:1-7", "Revelation 22:1-5"],
  },
  {
    id: "the-story-in-our-hands",
    title: "The Story in Our Hands",
    overview:
      "The journey ends by sending readers outward: to serve, to make peace, and to carry the story's hope into the life of the world.",
    references: ["Matthew 28:16-20", "Philippians 2:1-11"],
  },
];

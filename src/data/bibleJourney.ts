export type JourneyPeriod = {
  id: string;
  title: string;
  overview: string;
  references: string[];
  scene: string;
  artPrompt: string;
};

export const bibleJourney: JourneyPeriod[] = [
  {
    id: "a-world-awakened",
    title: "Creation, Fracture, and a World in Need",
    overview:
      "God makes a good world and entrusts it to humankind. Human distrust fractures that beginning; violence spreads, a flood brings judgment and rescue, and Babel scatters a people seeking to make a name for themselves.",
    references: ["Genesis 1:1-5", "Genesis 3:8-15", "Genesis 6:13-22", "Genesis 11:1-9"],
    scene: "creation",
    artPrompt:
      "An original editorial illustration of the first light over an unfinished ancient world: deep indigo heavens, a warm horizon, dark water, and newly emerging land, contemplative and symbolic rather than literal, with no text.",
  },
  {
    id: "a-promise-takes-root",
    title: "A Family Chosen for Blessing",
    overview:
      "Abram and Sarai leave home with a promise that their family will become a blessing to all peoples. Isaac, Jacob, and Joseph carry that family story through conflict and reconciliation until famine brings them to Egypt.",
    references: ["Genesis 12:1-9", "Genesis 15:1-6", "Genesis 22:1-14", "Genesis 50:15-21"],
    scene: "family",
    artPrompt:
      "An original editorial illustration of a small ancient family caravan crossing a wide ochre wilderness beneath a star-filled sky, with distant hills and one guiding path, humane and quietly hopeful, no text.",
  },
  {
    id: "freedom-and-belonging",
    title: "Out of Egypt, Into Covenant",
    overview:
      "Oppressed in Egypt, the descendants of Israel hear Moses called at the burning bush. Passover and the crossing of the sea lead them toward Sinai, where a newly freed people receive a covenant and learn a shared way of life.",
    references: ["Exodus 3:1-12", "Exodus 12:21-28", "Exodus 14:21-31", "Exodus 19:3-8"],
    scene: "exodus",
    artPrompt:
      "An original editorial illustration of a people crossing a passage through the sea at dawn, water rising like deep blue walls around a dry path, with a small warm light ahead, respectful and cinematic, no text.",
  },
  {
    id: "a-kingdom-under-question",
    title: "A Land, a People, and the Judges",
    overview:
      "After the wilderness, Israel enters the land and renews its covenant. The generations that follow struggle to remain faithful; the judges rise in seasons of crisis, while Ruth's loyalty offers a quieter portrait of steadfastness.",
    references: ["Joshua 3:14-17", "Joshua 24:14-24", "Judges 2:6-19", "Ruth 1:16-17"],
    scene: "land",
    artPrompt:
      "An original editorial illustration of a green valley opening beyond a river toward the hill country, with a simple stone marker in the foreground and late-summer light, grounded in the ancient landscape, no text.",
  },
  {
    id: "voices-for-the-road-home",
    title: "One Kingdom: Saul, David, and Solomon",
    overview:
      "Israel asks for a king. Saul's reign gives way to David, whose house receives a lasting promise; Solomon succeeds him and builds the Jerusalem temple, the center of worship for the united kingdom.",
    references: ["1 Samuel 8:4-9", "1 Samuel 16:1-13", "2 Samuel 7:8-16", "1 Kings 8:22-30"],
    scene: "kingdom",
    artPrompt:
      "An original editorial illustration of ancient Jerusalem on a ridge at sunset, a modest royal citadel and temple silhouette above terraced stone houses, muted copper and olive tones, no text.",
  },
  {
    id: "good-news-in-a-small-town",
    title: "Two Kingdoms and the Prophets",
    overview:
      "After Solomon, the kingdom divides into Israel in the north and Judah in the south. Prophets call both kingdoms back to justice and covenant faithfulness; the northern kingdom falls to Assyria, and later Babylon conquers Judah.",
    references: ["1 Kings 12:16-24", "Isaiah 1:16-20", "2 Kings 17:6-18", "2 Kings 25:1-12"],
    scene: "kingdoms",
    artPrompt:
      "An original editorial illustration of two neighboring ancient hilltop cities divided by a deep valley, distant storm clouds gathering beyond their walls, a lone prophetic figure in the foreground, restrained earth tones, no text.",
  },
  {
    id: "love-given-to-the-end",
    title: "Exile: Jerusalem Falls, Hope Endures",
    overview:
      "Jerusalem's temple and walls are destroyed, and many people are deported to Babylon. Far from home, they grieve, keep faith, and imagine renewal; Daniel's courage and Ezekiel's vision hold hope open in exile.",
    references: ["Psalms 137:1-6", "Daniel 1:1-7", "Daniel 6:16-23", "Ezekiel 37:1-14"],
    scene: "exile",
    artPrompt:
      "An original editorial illustration of Judean exiles beside the rivers of Babylon, distant city walls reflected in still water, a small harp resting nearby beneath a broad dusk sky, tender and dignified, no text.",
  },
  {
    id: "morning-beyond-the-stone",
    title: "Return, Rebuilding, and Waiting",
    overview:
      "Persia's king permits the exiles to return. The temple and Jerusalem's community are rebuilt; Ezra reads the law aloud, and later prophets keep alive the hope of God's promised renewal.",
    references: ["Ezra 1:1-8", "Ezra 3:10-13", "Nehemiah 8:1-12", "Malachi 3:1-4"],
    scene: "return",
    artPrompt:
      "An original editorial illustration of Jerusalem's temple being rebuilt with hand-cut pale stone, workers and families gathering in the foreground, morning light over the city, patient and hopeful, no text.",
  },
  {
    id: "a-welcome-without-borders",
    title: "Jesus Arrives and Announces God's Reign",
    overview:
      "After generations of waiting, the birth of Jesus is announced. At his baptism he is named God's beloved Son, then begins teaching and healing, declaring good news and release in the towns of Galilee.",
    references: ["Luke 1:26-38", "Luke 2:1-14", "Luke 3:21-22", "Luke 4:16-21"],
    scene: "galilee",
    artPrompt:
      "An original editorial illustration of a first-century Galilean village at morning, a teacher speaking beneath a simple stone portico as neighbors gather to listen, warm natural light and human scale, no text.",
  },
  {
    id: "learning-to-be-one-body",
    title: "The Cross and the Empty Tomb",
    overview:
      "At the final meal Jesus shares bread and cup with his disciples. He is crucified and buried; on the third day women find the tomb empty. The risen Jesus sends his followers to bear witness to all nations.",
    references: ["Mark 14:22-25", "Mark 15:33-39", "Luke 24:1-12", "Matthew 28:16-20"],
    scene: "resurrection",
    artPrompt:
      "An original editorial illustration of an open rock-cut tomb at first light, a rolled stone and folded linen visible at the entrance, olive branches and a quiet path, reverent and hopeful without depicting the risen Jesus, no text.",
  },
  {
    id: "a-future-worth-living-toward",
    title: "The Spirit Forms a New Community",
    overview:
      "At Pentecost the Spirit empowers Jesus' followers to speak across languages. They share meals and possessions, welcome new believers, and continue their witness even as persecution scatters them from Jerusalem.",
    references: ["Acts 2:1-13", "Acts 2:42-47", "Acts 7:54-60", "Acts 8:1-8"],
    scene: "pentecost",
    artPrompt:
      "An original editorial illustration of a diverse first-century gathering sharing bread in a sunlit courtyard, small flame-like lights suggested above the group, lively yet gentle and historically grounded, no text.",
  },
  {
    id: "the-story-in-our-hands",
    title: "The Good News Crosses the World",
    overview:
      "Peter recognizes God's welcome among Gentiles, and the church sends Paul and Barnabas on mission. The message travels through cities and across the sea to Rome; Acts ends with the good news still being proclaimed, and the church's mission continuing.",
    references: ["Acts 10:34-48", "Acts 13:1-5", "Acts 15:6-11", "Acts 28:23-31"],
    scene: "mission",
    artPrompt:
      "An original editorial illustration of an ancient Mediterranean harbor with a small sailing vessel setting out toward distant coastal cities, a winding road leading from the shore, bright open sky, expansive and unfinished, no text.",
  },
];

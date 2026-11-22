# -*- coding: utf-8 -*-
"""Grade 11 Advanced Tests · rubrics for constructed-response items (Q3, Q4, Q5, Q6, Q10).

READING ideas: an idea is a list of FORMS; a form is a list of GROUPS; a group is "alt1|alt2|..."
(regex fragments matched on the normalised answer with word boundaries).
 - an answer matches an idea when ALL groups of ANY form match  -> correct
 - some groups of a form match (>= half)                          -> teacher review
 - a form written with a leading 'R:' means "plausible but not the model" -> teacher review
Q3/Q4 are worth 1 (one idea needed). Q5/Q6 are worth 2 (two different ideas, one per box).

REWRITES (Q10): accept = extra full answers accepted besides the model; accept_re = regexes for
accepted answers; the grammar target comes from the word(s) in brackets (see ssh-cr.js).
"""
R = {}
def F(*groups): return {'all': list(groups)}            # a form: all groups must match
def I(*forms): return {'forms': list(forms)}             # an idea: any form matches
def Rv(*groups): return {'forms': [{'all': list(groups)}], 'review': True}   # plausible -> teacher review
def item(t, key, **kw): R.setdefault(str(t), {})[key] = kw

# ---------------- TEST 1 · Plastic on Our Plates ----------------
item(1, 'q3', ideas=[I(F(r'plankton|small creatures|creatures', r'(small|little) fish|fish', r'larg\w* predators|bigger fish|larger fish|predators|tuna|big fish|bigger animals|larger animals'))])
item(1, 'q4_0', ideas=[I(F(r'maximum|max|biggest|largest|less than|smaller than|under|up to|not more than|below', r'size|long|length|big|pieces?|particles?|microplastics?|plastic'))])
item(1, 'q4_1', ideas=[I(F(r'found|discovered|detected|first time|find', 'blood'))])
item(1, 'q5', ideas=[I(F(r'deliberately|on purpose|intentionally|purposely'), F(r'beads|microbeads|face wash\w*|toothpastes?|cosmetics?')), I(F(r'break\w*|broke|broken|split|crack\w*', r'apart|down|up|pieces|larger|bigger|sun\w*|waves?|wind')), I(F(r'cloth\w*|fabrics?|polyester|fibres?|fibers?|synthetic'))])
item(1, 'q6', ideas=[I(F('natural', r'fabrics?|cloth\w*|materials?')), I(F(r'wash\w*', r'less|fewer|not (so )?often|rarely')), I(F(r'avoid\w*|not use|stop using|reduce|less|do not use|no more|refuse', r'single use|plastics?|plastic bags?|bottles?'))])
item(1, 'rw0', accept=['the particles are so small that you cannot see them', 'the particles are so small that they cannot be seen'])
item(1, 'rw1', accept=['although there are bans microplastics are still common', 'although microplastics have been banned they are still common',
                      'although there have been bans microplastics are still common', 'although there were bans microplastics are still common'])
item(1, 'rw2', accept=['before the fish ate the plastic it had entered the sea', 'the plastic had entered the sea before the fish ate it',
                      'before the fish ate it the plastic had entered the sea'])
item(1, 'rw3', accept=[], accept_re=[r'^(you|we|people|everyone|everybody|they) should wash (your|our|their)? ?synthetic clothes less often$'])

# ---------------- TEST 2 · Titanic ----------------
item(2, 'q3', ideas=[I(F(r'sink|sank|sunk|go down', r'hours?|two|three|2|3')), Rv(r'sink|sank|sunk|go down')])
item(2, 'q4_0', ideas=[I(F(r'lookout|saw|seen|spotted|noticed|see', 'iceberg')), Rv(r'hit|struck|crash\w*|collid\w*|collision')])
item(2, 'q4_1', ideas=[I(F(r'found|discovered|located|find|discovery', r'wreck|titanic|ship'))])
item(2, 'q5', ideas=[I(F(r'20|twenty|not enough|only|few\w*|half|lack', r'lifeboats?|boats')), I(F(r'lower\w*|launch\w*|left|sent|went', r'before|not full|half empty|empty')), I(F(r'warnings?|messages?', r'captain|not reach|never reached|ignored|busy'))])
item(2, 'q6', ideas=[I(F(r'enough|more|all', r'lifeboats?')), I(F(r'radios?', r'24|twenty four|all day|day and night|working|on')), I(F(r'ice patrol|patrol|warn ships'))])
item(2, 'rw0', accept=['the water was so cold that people could only survive for minutes', 'the water was so cold that people could survive only for minutes',
                      'the water was so cold that people could only survive for a few minutes'])
item(2, 'rw1', accept=['after the ship had hit the iceberg water entered the compartments', 'water entered the compartments after the ship had hit the iceberg'])
item(2, 'rw2', accept=['while the passengers were eating dinner the radio operators received a warning', 'the radio operators received a warning while the passengers were eating dinner'])
item(2, 'rw3', accept=['every ship must carry enough lifeboats', 'all ships must carry enough lifeboats', 'each ship must carry enough lifeboats', 'ships must carry enough lifeboats'])

# ---------------- TEST 3 · Urban heat ----------------
item(3, 'q3', ideas=[I(F(r'walk\w*|cycl\w*|bik\w*', r'less attractive|not attractive|unattractive|unpleasant|uncomfortable|less|do not want|avoid|too hot|hot|heat|not enjoy|hard|difficult'))])
item(3, 'q4_0', ideas=[I(F(r'heat ?wave|heat|hot', r'europe|70000|deaths?|died|killed|people'))])
item(3, 'q4_1', ideas=[I(F(r'deaths?|died|dead|killed|lives|people', r'heat ?wave|2003|europe|heat'))])
item(3, 'q5', ideas=[I(F(r'concrete|asphalt|dark|black|materials?|roads?|buildings?|roofs?|surfaces?|car parks?', r'absorb\w*|heat|store\w*|release\w*|hot|energy')), I(F(r'fewer|less|lack|no|not many|not enough|few', r'trees?|plants?|green\w*|shade')), I(F(r'cars?|factor\w*|air condition\w*|human activit\w*|machines')), I(F(r'tall buildings|close together|trap\w*|block\w*', r'air|wind\w*|buildings?'))])
item(3, 'q6', ideas=[I(F(r'plant\w*', r'trees?')), I(F(r'green roofs?|roofs? (covered )?with plants|plants on roofs?')), I(F(r'paint\w*|white|light', r'roofs?|roads?|colou?rs?|grey|gray')), I(F(r'shade\w*|walkways?|fountains?|traditional design\w*|air (to )?move'))])
item(3, 'rw0', accept=['the streets were so hot that nobody wanted to walk', 'the streets were so hot that no one wanted to walk'])
item(3, 'rw1', accept=['despite being large the city has many parks', 'despite its size the city has many parks', 'despite the fact that the city is large it has many parks',
                      'despite being large the city has a lot of parks', 'despite the city being large it has many parks', 'despite its large size the city has many parks'])
item(3, 'rw2', accept=['they planted trees so that the street would be cooler', 'they planted trees so that the street could be cooler',
                      'they planted trees so that the street will be cooler'])
item(3, 'rw3', accept_re=[r'^(you|we|people|everyone|everybody) should stay (at home|indoors|inside) during a heat ?wave$'])

# ---------------- TEST 4 · Zoos ----------------
item(4, 'q3', ideas=[I(F(r'never learn|not learn|do not learn|lack|without|cannot learn|fail to learn', r'skills?|hunt\w*|surviv\w*'), F(r'cannot|unable|never|not able', r'return|go back|surviv\w*|live', 'wild'))])
item(4, 'q4_0', ideas=[I(F(r'people|visitors|visit\w*', r'zoos?|aquariums?|every year|each year|a year|per year|annually'))])
item(4, 'q4_1', ideas=[I(F(r'endangered|species|bird|animal', r'disappear\w*|extinct|saved|breeding|zoos?|protect\w*'))])
item(4, 'q5', ideas=[I(F(r'conserv\w*|breed\w*|endangered|protect\w*|save\w*|disappear\w*|extinct')), I(F(r'research|fund\w*|habitats?')), I(F(r'educat\w*|teach\w*|learn\w*|children|biodiversity|knowledge')), I(F(r'emotional|connection|real animals?|seeing'))])
item(4, 'q6', ideas=[I(F(r'cages?|enclosures?|natural looking|larger|bigger|more space|natural')), I(F(r'focus\w*|only|concentrate\w*', r'species|endangered|protection|need protection')), Rv(r'sanctuar\w*|safari')])
item(4, 'rw0', accept=['the enclosure was so small that the elephants looked stressed'])
item(4, 'rw1', accept=['although the zoo is criticised it is popular', 'although the zoo is criticized it is popular', 'although there is criticism the zoo is popular',
                      'although people criticise the zoo it is popular', 'although people criticize the zoo it is popular', 'although the zoo has been criticised it is popular',
                      'although the zoo is criticised it is still popular', 'although there is criticism the zoo is still popular'])
item(4, 'rw2', accept_re=[r'^(you|we|people|students) (do|does) not have to visit a zoo to learn about animals$'])
item(4, 'rw3', accept=['i was going to visit the zoo but it rained'])

# ---------------- TEST 5 · Bedouin ----------------
item(5, 'q3', ideas=[I(F(r'three|3'))])
item(5, 'q4_0', ideas=[I(F(r'mov\w*|moved|travel\w*|took|went', r'herds?|animals?|grazing|desert|camels|goats|sheep')), Rv(r'rain\w*|plants?|grew|grow')])
item(5, 'q4_1', ideas=[I(F(r'oil|life changed|changed rapidly|settled|towns?|cities|city|modern|jobs|schools|houses'))])
item(5, 'q5', ideas=[I(F(r'stars?')), I(F(r'predict\w*|forecast\w*|know|knew|guess\w*|read\w*|understand\w*', 'weather')), Rv(r'walk\w*|long distances?|heat|hot|look\w* after|animals?|patience')])
item(5, 'q6', ideas=[I(F(r'camels?', r'rac\w*')), I(F(r'falcon\w*')), I(F(r'poetry|poems?|poets?')), I(F(r'museum|objects'))])
item(5, 'rw0', accept=['after they had moved to the city life became easier', 'life became easier after they had moved to the city'])
item(5, 'rw1', accept=['the desert was such a hot place that they travelled at night', 'it was such a hot desert that they travelled at night',
                      'the desert was such a hot place that they traveled at night', 'it was such a hot desert that they traveled at night',
                      'the desert had such hot weather that they travelled at night', 'there was such hot weather in the desert that they travelled at night'])
item(5, 'rw2', accept=['he got used to living in an apartment', 'he has got used to living in an apartment', 'he got used to living in the apartment',
                      'he has gotten used to living in an apartment'])
item(5, 'rw3', accept=['my grandfather used to ride camels when he was young', 'when my grandfather was young he used to ride camels',
                      'my grandfather used to ride camels'])

# ---------------- TEST 6 · Overfishing ----------------
item(6, 'q3', ideas=[I(F('algae', r'cover\w*|kill\w*|grow\w*|spread\w*|damage\w*|destroy\w*'))])
item(6, 'q4_0', ideas=[I(F(r'boats?|ships?|vessels?', r'wood\w*|traditional|fisherm\w*|fishing|old')), Rv(r'boats?|ships?')])
item(6, 'q4_1', ideas=[I(F(r'hammour|fish', r'fell|fall|decreas\w*|drop\w*|declin\w*|less|reduc\w*|lost|fewer|went down'))])
item(6, 'q5', ideas=[I(F(r'demand|population|wealth\w*|richer|rich|more people|people wanted')), I(F(r'modern|powerful|engines?|nets|finders?|electronic|technology|boats?'))])
item(6, 'q6', ideas=[I(F(r'seasons?|ban\w*|breed\w*')), I(F(r'minimum|size|nets|type\w* of nets')), I(F(r'mangroves?|artificial reefs?|reefs?'))])
item(6, 'rw0', accept=['the demand for fish was so high that prices rose', 'the demand for fish was so high that the prices rose'])
item(6, 'rw1', accept=['after they had built the hotel the mangroves disappeared', 'the mangroves disappeared after they had built the hotel'])
item(6, 'rw2', accept=['in spite of the high price people still buy fish', 'in spite of the high price people still buy it', 'in spite of fish being expensive people still buy it',
                      'in spite of the fact that fish is expensive people still buy it', 'in spite of its high price people still buy fish',
                      'in spite of the high prices people still buy fish', 'in spite of being expensive fish is still bought by people',
                      'in spite of fish being expensive people still buy fish'])
item(6, 'rw3', accept=['the fishing rules must be enforced', 'governments must enforce the fishing rules'],
     accept_re=[r'^(we|they|the government|governments|people|the authorities|authorities) must enforce the fishing rules$'])

# ---------------- TEST 7 · Embarrassment ----------------
item(7, 'q3', ideas=[I(F(r'busy|thinking|think\w*|focus\w*|care\w*', r'themselves|own|their own'))])
item(7, 'q4_0', ideas=[I(F(r'study|research|experiment', r'embarrass\w*|blush\w*|judg\w*|university|california|mistakes?|trust\w*|honest'))])
item(7, 'q4_1', ideas=[I(F(r'child\w*|kids|bab\w*|start\w*|begin|feel|age', r'embarrass\w*'))])
item(7, 'q5', ideas=[I(F('face', r'red|blush\w*'), F(r'blush\w*')), I(F(r'heart\w*', r'beat\w*|faster|fast|rac\w*|quick\w*'))])
item(7, 'q6', ideas=[I(F(r'laugh\w*|humou?r')), I(F(r'everyone|everybody|all people|all of us|we all|people', r'mistakes?')), I(F(r'accept\w*|learn\w* from|move on|do not replay|stop replaying'))])
item(7, 'rw0', accept=['i was so embarrassed that i could not speak'])
item(7, 'rw1', accept=['despite feeling nervous he still asked a question', 'despite the fact that he felt nervous he still asked a question',
                      'despite being nervous he still asked a question', 'despite his nervousness he still asked a question',
                      'despite feeling nervous he asked a question', 'despite being nervous he asked a question'])
item(7, 'rw2', accept=['i was walking into class when i tripped over a bag', 'when i was walking into class i tripped over a bag'])
item(7, 'rw3', accept_re=[r'^(you|we|people|everyone|everybody) should laugh at (yourself|ourselves|themselves|yourselves)$'])

# ---------------- TEST 8 · Gap year ----------------
item(8, 'q3', ideas=[I(F(r'delay\w*|postpone\w*|defer\w*|later|wait\w*|put off', r'start\w*|place|year|university|course\w*'))])
item(8, 'q4_0', ideas=[I(F(r'gap years?|gap', r'students?|thousands|common|take|takes|young people'))])
item(8, 'q4_1', ideas=[I(F(r'documents?|records?|summary|paper|curriculum vitae|resume|profile', r'experiences?|employ\w*|jobs?|work|skills?|gap year|improve\w*|qualifications?')), Rv(r'employ\w*|experiences?|skills?|improve\w*')])
item(8, 'q5', ideas=[I(F(r'independent|mature|confiden\w*|responsib\w*')), I(F(r'cultur\w*|open minded|tolerant|travel\w*')), I(F(r'think|decide|know what|motivat\w*', r'study|studies|want\w*|university|career|motivat\w*')), Rv(r'cv|employ\w*|skills?|languages?|team\w*|volunteer\w*')])
item(8, 'q6', ideas=[I(F(r'expensive|cost\w*|afford|money')), I(F(r'habit|studying|study|education', r'lose|lost|difficult|hard|return|forget')), I(F(r'never go|do not go|not go|not going|never return|do not return', r'university|uni|college|education')), I(F(r'poorly organi\w*|badly organi\w*|volunteer programmes?|volunteer programs?|help the volunteers'))])
item(8, 'rw0', accept=['the trip was so expensive that few students could afford it', 'the trip was so expensive that only a few students could afford it'])
item(8, 'rw1', accept=['before she started university she had volunteered in africa', 'she had volunteered in africa before she started university'])
item(8, 'rw2', accept=['despite enjoying travelling he missed his family', 'despite enjoying traveling he missed his family', 'despite the fact that he enjoyed travelling he missed his family',
                      'despite the fact that he enjoyed traveling he missed his family', 'despite his enjoyment of travelling he missed his family',
                      'despite enjoying travelling he still missed his family'])
item(8, 'rw3', accept=['she is used to living away from home', 'now she is used to living away from home', 'she is now used to living away from home'])

# ---------------- TEST 9 · Apollo 13 ----------------
item(9, 'q3', ideas=[I(F('houston', 'problem'))])
item(9, 'q4_0', ideas=[I(F(r'far|distance|away|from', 'earth'))])
item(9, 'q4_1', ideas=[I(F(r'return\w*|land\w*|came back|come back|home|splash\w*|safe\w*|back'))])
item(9, 'q5', ideas=[I(F(r'oxygen|electric\w*|power')), I(F(r'cold|temperature|freezing|3')), I(F(r'carbon dioxide|co2|carbon')), I(F(r'water|dehydrat\w*|drink\w*|thirst\w*')), I(F(r'landing|moon', r'cancel\w*|could not|stopp\w*'))])
item(9, 'q6', ideas=[I(F(r'plastic bags?|bags?')), I(F('cardboard')), I(F('tape'))])
item(9, 'rw0', accept=['after the tank had exploded the crew moved into the lunar module', 'the crew moved into the lunar module after the tank had exploded'])
item(9, 'rw1', accept=['the astronauts were sleeping when they heard a loud bang', 'when the astronauts heard a loud bang they were sleeping'])
item(9, 'rw2', accept=['it was such a difficult problem that engineers worked all night', 'it was such a difficult problem that the engineers worked all night'])
item(9, 'rw3', accept=['they worked hard so that they could bring the crew home', 'they worked hard so that they would bring the crew home',
                      'they worked hard so that they might bring the crew home', 'they worked hard so that they could bring the crew back home'])

# ---------------- TEST 10 · AI ----------------
item(10, 'q3', ideas=[I(F(r'mark\w*|correct\w*|grad\w*|check\w*', r'exercises?|homework|simple|work|tests?'), F(r'creat\w*|make|making|prepar\w*|generat\w*|write|writing', r'practice|materials?|exercises?|worksheets?|tests?'))])
item(10, 'q4_0', ideas=[I(F(r'tools?|devices?|technology|things?|machines?', r'schools?|taught|teach|learn\w*|students|use|compared|past')), Rv(r'tools?|devices?|technology')])
item(10, 'q4_1', ideas=[I(F(r'essays?|writ\w*|final'))])
item(10, 'q5', ideas=[I(F(r'explain\w*|tutor|different ways|understand\w*')), I(F(r'any time|anytime|available|24|all day')), I(F(r'afford|private lessons?|embarrass\w*|ask questions|shy')), I(F(r'future|jobs?|skills?|employ\w*|careers?'))])
item(10, 'q6', ideas=[I(F(r'cheat\w*|without learning|copy\w*|write their essays?|not learn\w*')), I(F(r'critical\w*|think\w*|solve problems|problem solving|own ideas|express')), I(F(r'wrong|incorrect|false|mistakes?|inaccurate|convincing|errors?'))])
item(10, 'rw0', accept_re=[r'^(you|we|students|people|everyone) should check every fact (that )?(ai|it) provides$'])
item(10, 'rw1', accept=['although there are risks many schools allow ai', 'although there are risks many schools allow it', 'although ai has risks many schools allow it',
                       'although ai is risky many schools allow it', 'although there are some risks many schools allow ai', 'although it is risky many schools allow ai'])
item(10, 'rw2', accept=['students write their essays in class so that teachers can prevent cheating', 'students write their essays in class so that they cannot cheat',
                       'students write their essays in class so that teachers could prevent cheating'])
item(10, 'rw3', accept=['students used to find information in books', 'in the past students used to find information in books'])

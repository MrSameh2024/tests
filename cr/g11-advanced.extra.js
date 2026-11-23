/* Smart Students Hub · rubric overlay for g11-advanced.html (hand-maintained, v1)
   Adds to the generated rubric (cr/g11-advanced.js) without editing it:
     reject  – patterns that show the answer is factually different from the text (→ ✗ with a reason)
     ideas   – {idea:i, forms:[…]} adds acceptable wordings to idea i; {forms:[…]} adds a new idea
     accept  – extra accepted sentences for grammar rewrites
   Every entry below records why it was added (QA ref = row in the G11 QA report). */
(function (root) {
  var X = {
    "5": {
      // QA T5-q3: "three|3" alone accepted "three weeks" / "three hours"
      "q3": { "reject": ["(three|3) (weeks?|months?|years?|hours?|nights?)"] }
    },
    "2": {
      // QA T2-q5: "They did not have enough lifeboats" (correct) was not recognised
      "q5": { "ideas": [{ "idea": 0, "forms": [{ "all": ["(did )?not have enough|insufficient|too few|not sufficient", "lifeboats?|boats"] }] }] },
      // Real-answer review 23 Nov: "The iceberg scraped along the side …" (what happened at 11:40 pm) was 0 → teacher review
      "q4_0": { "ideas": [{ "idea": 1, "forms": [{ "all": ["scrap\\w*|tore|opened"] }] }] }
    },
    "1": {
      // Real-answer review 23 Nov: "the size of microplastics" (no "maximum") was 0 → teacher review instead
      "q4_0": { "reject": ["under (the )?(sea|water|ocean)"], "ideas": [{ "forms": [{ "all": ["size|length|long|big", "microplastic\\w*|plastic\\w*|pieces?|particles?"] }], "review": true }] },
      // Real-answer review 23 Nov: "Small animals eat microplastics, and bigger animals eat those smaller animals" was 0 → teacher review
      "q3": { "ideas": [{ "forms": [{ "all": ["(small|little|tiny|smaller) (animals?|creatures?|organisms?)", "big\\w*|larg\\w*"] }], "review": true }] },
      // QA T1-rw1: extra correct wordings with although
      "rw1": { "accept": ["although microplastics are banned they are still common", "although there are bans on microplastics they are still common", "although microplastics have been banned they are still very common"] },
      // QA T1-q4_0 "plastic under the sea" must not count as "maximum size": reject pattern is in the q4_0 entry above
    }
  };
  root.SSH_CR_EXTRA = X;
  if (root.SSHCR && root.SSHCR.mergeRubric && root.SSH_CR && root.SSH_CR.tests) root.SSHCR.mergeRubric(root.SSH_CR.tests, X);
})(typeof window !== 'undefined' ? window : this);

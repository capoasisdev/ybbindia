
ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb;

DROP POLICY IF EXISTS "attempts learner insert" ON public.exam_attempts;
CREATE POLICY "attempts learner insert" ON public.exam_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_enrolled(auth.uid()));

DROP POLICY IF EXISTS "attempts learner update" ON public.exam_attempts;
CREATE POLICY "attempts learner update" ON public.exam_attempts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "attempts staff manage" ON public.exam_attempts;
CREATE POLICY "attempts staff manage" ON public.exam_attempts
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;

WITH bank(pos, prompt, opts, correct) AS (
  VALUES
  (1,'A business broker primarily acts as:','["An intermediary between business sellers and buyers","A lender providing acquisition finance","A statutory auditor of the target","A government licensing authority"]','a'),
  (1,'Which best describes a broker''s duty of confidentiality?','["Deal details are shared only with qualified, NDA-bound parties","All details may be published to attract buyers","Confidentiality applies only after closing","Only the buyer is owed confidentiality"]','a'),
  (1,'A broker''s fee is most commonly structured as:','["A success fee linked to transaction value","An hourly consulting rate only","A fixed government tariff","A share of the buyer''s future profits"]','a'),
  (1,'The main benefit of engaging a broker for an SME owner is:','["Access to a wider, screened buyer pool and a managed process","Guaranteed sale at the asking price","Elimination of all tax liability","Automatic bank approval for the buyer"]','a'),
  (1,'A No Objection to Contact list is used to:','["Record buyers the seller does not want approached","List all lenders in the market","Track marketing spend","Register the business with the registrar"]','a'),
  (2,'MSME classification in India is currently based on:','["Investment in plant/equipment and annual turnover","Number of employees only","Export volume only","Age of the enterprise"]','a'),
  (2,'A common reason Indian SME owners sell is:','["Succession gaps in the next generation","Mandatory statutory retirement","A legal cap on ownership tenure","Compulsory annual re-registration"]','a'),
  (2,'Informal or unrecorded cash transactions in an SME typically:','["Reduce credible, verifiable earnings and lower valuation","Increase the verified valuation","Have no effect on diligence","Are always adjusted upward by buyers"]','a'),
  (2,'GST registration data is useful to a broker because it:','["Provides an independent cross-check on reported revenue","Reveals the buyer''s funding capacity","Sets the statutory sale price","Replaces the need for financial statements"]','a'),
  (2,'Which sector trend most expands SME deal flow in India?','["Consolidation by larger organised players","A ban on foreign investment","Falling internet penetration","Reduced formalisation of business"]','a'),
  (3,'The most reliable long-term source of seller mandates is:','["Referrals from accountants, bankers and past clients","Unsolicited bulk email blasts","Anonymous classified adverts","Cold walk-ins without preparation"]','a'),
  (3,'A qualified buyer lead must demonstrate:','["Financial capacity, intent and a relevant acquisition profile","Interest alone","Willingness to sign a term sheet on day one","A personal connection to the seller"]','a'),
  (3,'An exclusive mandate benefits the broker because it:','["Justifies investment in a full marketing process","Removes the need for a written agreement","Guarantees a higher sale price","Eliminates the seller''s obligations"]','a'),
  (3,'A blind profile (teaser) should:','["Describe the opportunity without identifying the business","Include the full client list","Name the seller and key staff","Disclose the reserve price"]','a'),
  (3,'The first step after a buyer expresses interest is usually to:','["Qualify the buyer and execute an NDA","Share the full information memorandum","Introduce them to staff","Agree the final price"]','a'),
  (4,'SDE (Seller''s Discretionary Earnings) adds back:','["Owner''s salary, perks and non-recurring items","Cost of goods sold","All operating payroll","Interest income only"]','a'),
  (4,'An EBITDA multiple approach is an example of:','["Market-based valuation","Asset-based valuation","Liquidation valuation","Replacement cost valuation"]','a'),
  (4,'Discounted Cash Flow valuation is most sensitive to:','["Discount rate and terminal growth assumptions","The company''s registered address","Historical share capital","The broker''s fee"]','a'),
  (4,'Asset-based valuation is most appropriate when:','["Earnings are weak but tangible assets are substantial","The business has high goodwill","Cash flows are stable and growing","The buyer is a strategic acquirer"]','a'),
  (4,'A normalisation adjustment corrects for:','["Non-recurring or non-business expenses","Statutory tax rates","Market interest rates","Buyer financing terms"]','a'),
  (5,'A quality of earnings review focuses on:','["Sustainability and accuracy of reported profits","Marketing creative quality","Employee satisfaction scores","Website traffic"]','a'),
  (5,'Working capital in a transaction is normally:','["Delivered at a normalised target level at closing","Retained entirely by the seller","Ignored in the purchase price","Paid separately by the broker"]','a'),
  (5,'High customer concentration typically:','["Increases perceived risk and lowers the multiple","Raises the multiple","Has no bearing on value","Guarantees earn-out payment"]','a'),
  (5,'Add-backs must be:','["Documented and defensible with evidence","Estimated verbally","Applied to every expense line","Approved by the tax authority"]','a'),
  (5,'A cash-free, debt-free basis means:','["Seller settles debt and retains surplus cash at closing","Buyer assumes all debt at no cost","No cash may change hands","Debt is converted to equity"]','a'),
  (6,'Pre-sale preparation should ideally begin:','["12 to 24 months before going to market","One week before listing","After the first offer","Only once diligence starts"]','a'),
  (6,'A key exit-readiness action is to:','["Clean up books, contracts and statutory filings","Increase owner dependence","Delay tax filings","Remove management layers"]','a'),
  (6,'Owner dependence is reduced by:','["Documenting processes and empowering a management team","Centralising all decisions with the owner","Reducing staff training","Avoiding written procedures"]','a'),
  (6,'An information memorandum should:','["Present verified operational and financial detail","Contain only marketing claims","Omit all risks","Be shared publicly"]','a'),
  (6,'Which item most commonly delays an SME sale?','["Unresolved statutory or licensing non-compliance","A modern website","A trained sales team","Audited accounts"]','a'),
  (7,'Confidential marketing means:','["Reaching targeted buyers without revealing the seller''s identity","Advertising the seller name widely","Marketing only to employees","No marketing at all"]','a'),
  (7,'A buyer outreach list should be prioritised by:','["Strategic fit and financial capacity","Alphabetical order","Geographic distance only","Company age only"]','a'),
  (7,'Strategic buyers usually pay more than financial buyers because:','["They can realise synergies","They borrow at zero cost","They skip diligence","They pay only in shares"]','a'),
  (7,'An NDA should be executed:','["Before disclosing confidential information","After the LOI is signed","At closing","Only for competitors"]','a'),
  (7,'Running a structured process with deadlines helps to:','["Create competitive tension and momentum","Delay decision-making","Reduce buyer numbers","Avoid valuation work"]','a'),
  (8,'BATNA refers to:','["Best alternative to a negotiated agreement","Binding agreement on terms and assets","Broker''s advance transaction notice","Buyer''s audited transaction analysis"]','a'),
  (8,'An earn-out is typically used to:','["Bridge a valuation gap using future performance","Pay the broker''s fee","Avoid all taxes","Fix the working capital target"]','a'),
  (8,'A letter of intent is generally:','["Largely non-binding except for specified clauses","Fully binding in all respects","A statutory filing","A financing commitment"]','a'),
  (8,'In negotiation, a broker should:','["Focus on interests, not fixed positions","Reveal the seller''s minimum price early","Avoid all counter-offers","Negotiate only on price"]','a'),
  (8,'Deal terms other than price that matter most include:','["Payment structure, indemnities and transition support","Office decor","Buyer''s logo","Broker''s travel plan"]','a'),
  (9,'Due diligence usually covers:','["Financial, legal, tax, operational and HR areas","Financial matters only","Marketing only","Only the buyer''s finances"]','a'),
  (9,'A virtual data room is used to:','["Share diligence documents securely with an audit trail","Publish accounts publicly","Store personal photos","Replace the NDA"]','a'),
  (9,'A red flag in diligence is best handled by:','["Disclosing early and proposing a remedy or price adjustment","Concealing it until closing","Ending the deal immediately","Ignoring it"]','a'),
  (9,'Statutory compliance checks in India would include:','["GST, PF, ESI, ROC and licence filings","Only GST","Only the shop board licence","No filings"]','a'),
  (9,'Diligence typically takes longer when:','["Records are incomplete or informal","Books are audited and organised","There is a single owner","The buyer is strategic"]','a'),
  (10,'A definitive agreement usually contains:','["Representations, warranties and indemnities","Only the price","Marketing collateral","Diligence checklists only"]','a'),
  (10,'Escrow is used to:','["Secure part of consideration against post-closing claims","Pay the broker in advance","Replace warranties","Fund the buyer''s tax"]','a'),
  (10,'A condition precedent is:','["A requirement that must be satisfied before closing","A post-closing bonus","A marketing milestone","A broker fee schedule"]','a'),
  (10,'Post-closing transition support commonly involves:','["A defined handover period by the seller","Immediate seller departure in all cases","Permanent seller employment","No buyer involvement"]','a'),
  (10,'A slump sale in India refers to:','["Transfer of an undertaking as a going concern for lump-sum consideration","Sale of individual assets at itemised values","A distressed auction only","A share buy-back"]','a'),
  (11,'A conflict of interest arises when a broker:','["Represents both parties without informed written consent","Advertises a mandate","Charges a success fee","Uses an NDA"]','a'),
  (11,'Misrepresenting financials to a buyer is:','["A serious ethical and legal breach","Acceptable if the seller requests it","Standard negotiating practice","Permitted under an NDA"]','a'),
  (11,'Client money or documents should be:','["Handled with clear records and appropriate safeguards","Mixed with the broker''s own funds","Shared freely with prospects","Destroyed after the deal"]','a'),
  (11,'Professional competence requires a broker to:','["Refer or seek expert help outside their expertise","Advise on all matters regardless of expertise","Avoid continuing education","Rely only on the seller''s view"]','a'),
  (11,'Ethical marketing of a mandate means:','["Accurate, evidence-based claims about the business","Exaggerating growth to attract buyers","Omitting known liabilities","Inventing buyer interest"]','a')
)
INSERT INTO public.questions (course_id, module_id, topic, difficulty, type, prompt, options, correct_option_ids, marks, is_archived)
SELECT m.course_id, m.id, m.title, 'medium', 'mcq', b.prompt,
       (SELECT jsonb_agg(jsonb_build_object('id', chr(96 + o.ord::int), 'text', o.val))
          FROM jsonb_array_elements_text(b.opts::jsonb) WITH ORDINALITY AS o(val, ord)),
       ARRAY[b.correct], 1, false
FROM bank b
JOIN public.modules m ON m.position = b.pos
WHERE NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.prompt = b.prompt);

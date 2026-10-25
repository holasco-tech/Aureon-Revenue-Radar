import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewPageHtml} from '../integration/review-page.mjs';
test('review page has manual confirmation and no automatic customer outreach',()=>{
 assert.match(reviewPageHtml,/Lead Review Queue/);
 assert.match(reviewPageHtml,/confirm\(/);
 assert.match(reviewPageHtml,/No customer message will be sent/);
 assert.match(reviewPageHtml,/\/api\/integrations\/review-queue/);
 assert.match(reviewPageHtml,/\/api\/integrations\/reviews/);
 assert.match(reviewPageHtml,/textContent/);
 assert.doesNotMatch(reviewPageHtml,/innerHTML\s*=/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {validateIntake,categoryCodes} from '../src/engine.js';
test('six categories',()=>assert.deepEqual(categoryCodes,['repairs','cleaning','maintenance','outdoor','moving_delivery','personal_assistance']));
test('personal assistance requires details',()=>assert.deepEqual(validateIntake('personal_assistance',{}),['assistanceType','description']));
test('repair intake passes',()=>assert.deepEqual(validateIntake('repairs',{problemType:'leak',description:'Kitchen sink'}),[]));

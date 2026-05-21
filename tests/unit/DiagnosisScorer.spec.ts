// tests/unit/DiagnosisScorer.test.ts
import { describe, test, expect } from 'vitest';
import { calculateDiagnosisScore, formatScoreForNPC } from '../../src/utils/DiagnosisScorer';
import type { DiagnosisResult } from '../../src/ui/html/DiagnosisUI';
import { DIAGNOSIS_CASES } from '../../src/ui/html/data/diagnosis-cases';

describe('DiagnosisScorer', () => {
  const testCase = DIAGNOSIS_CASES[0]; // case-001: 湿阻中焦

  describe('calculateDiagnosisScore', () => {
    test('should return 100 for perfect match', () => {
      const perfectResult: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' },
          pulse: { position: '关', quality: '濡缓' },
          symptoms: ['脘腹胀满', '便溏黏腻', '身重困倦'],
          syndrome: ['b1'], // 湿阻中焦（正确）
          prescription: ['f1', 'f2'] // 藿香正气散 + 平胃散（两个都是正确方剂）
        }
      };

      const result = calculateDiagnosisScore(perfectResult, testCase);
      expect(result.totalScore).toBe(100);
      expect(result.overallErrors).toHaveLength(0);
    });

    test('should return 0 for completely wrong answers', () => {
      const wrongResult: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '红', coating: '黄', shape: '瘦', moisture: '干燥' },
          pulse: { position: '寸', quality: '数' },
          symptoms: [],
          syndrome: ['b2', 'b3'], // 全错
          prescription: ['f3'] // 错误方剂
        }
      };

      const result = calculateDiagnosisScore(wrongResult, testCase);
      expect(result.totalScore).toBe(0);
      expect(result.overallErrors.length).toBeGreaterThan(0);
    });

    test('should correctly weight tongue (20%)', () => {
      const result: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' }, // 全对 = 20分
          pulse: { position: '寸', quality: '数' }, // 全错 = 0分
          symptoms: [],
          syndrome: ['b2'], // 错 = 0分
          prescription: ['f3'] // 错 = 0分
        }
      };

      const score = calculateDiagnosisScore(result, testCase);
      expect(score.breakdown.tongue.score).toBe(20);
      expect(score.totalScore).toBe(20);
    });

    test('should correctly weight syndrome (40%)', () => {
      const result: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '红', coating: '黄', shape: '瘦', moisture: '干燥' }, // 0分
          pulse: { position: '寸', quality: '数' }, // 0分
          symptoms: [],
          syndrome: ['b1'], // 正确 = 40分
          prescription: ['f3'] // 错 = 0分
        }
      };

      const score = calculateDiagnosisScore(result, testCase);
      expect(score.breakdown.syndrome.score).toBe(40);
      expect(score.totalScore).toBe(40);
    });

    test('should handle partial tongue score', () => {
      const result: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '淡白', coating: '白腻', shape: '瘦', moisture: '干燥' }, // 2正确 = 10分
          pulse: { position: '关', quality: '濡缓' }, // 全对 = 20分
          symptoms: [],
          syndrome: ['b1'], // 正确 = 40分
          prescription: ['f1'] // 部分正确 = 10分
        }
      };

      const score = calculateDiagnosisScore(result, testCase);
      expect(score.breakdown.tongue.score).toBe(10);
      expect(score.breakdown.pulse.score).toBe(20);
      expect(score.breakdown.syndrome.score).toBe(40);
      expect(score.breakdown.prescription.score).toBe(10);
      expect(score.totalScore).toBe(80);
    });

    test('should handle missing selections (undefined)', () => {
      const result: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: {}, // 全部未选 = 0分，4个错误
          pulse: {}, // 全部未选 = 0分，2个错误
          symptoms: [],
          syndrome: [], // 未选 = 0分，遗漏错误
          prescription: [] // 未选 = 0分，遗漏错误
        }
      };

      const score = calculateDiagnosisScore(result, testCase);
      expect(score.totalScore).toBe(0);
      expect(score.breakdown.tongue.errors).toHaveLength(4);
      expect(score.breakdown.pulse.errors).toHaveLength(2);
      expect(score.breakdown.syndrome.errors.length).toBeGreaterThan(0);
      expect(score.breakdown.prescription.errors.length).toBeGreaterThan(0);
    });
  });

  describe('formatScoreForNPC', () => {
    test('should format perfect score correctly', () => {
      const perfectResult: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' },
          pulse: { position: '关', quality: '濡缓' },
          symptoms: [],
          syndrome: ['b1'],
          prescription: ['f1', 'f2']
        }
      };

      const score = calculateDiagnosisScore(perfectResult, testCase);
      const prompt = formatScoreForNPC(score, '李秀梅', perfectResult);

      expect(prompt).toContain('评分：100分');
      expect(prompt).toContain('优秀');
      expect(prompt).toContain('舌诊：20分（正确）');
    });

    test('should format errors for NPC feedback', () => {
      const wrongResult: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '红', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' },
          pulse: { position: '关', quality: '濡缓' },
          symptoms: [],
          syndrome: ['b2'],
          prescription: ['f3']
        }
      };

      const score = calculateDiagnosisScore(wrongResult, testCase);
      const prompt = formatScoreForNPC(score, '李秀梅', wrongResult);

      expect(prompt).toContain('舌色应为');
      expect(prompt).toContain('辨证');
      expect(prompt).toContain('错误选择');
    });

    test('should include user answers in prompt', () => {
      const result: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' },
          pulse: { position: '关', quality: '濡缓' },
          symptoms: [],
          syndrome: ['b1'],
          prescription: ['f1']
        }
      };

      const score = calculateDiagnosisScore(result, testCase);
      const prompt = formatScoreForNPC(score, '李秀梅', result);

      expect(prompt).toContain('用户答案：');
      expect(prompt).toContain('b1');
      expect(prompt).toContain('f1');
    });

    test('should format different score levels', () => {
      const testScoreLevel = (score: number, expectedLevel: string) => {
        // Create a mock result with specific score
        const mockScoreResult = {
          totalScore: score,
          breakdown: {
            tongue: { score: 20, errors: [] },
            pulse: { score: 20, errors: [] },
            syndrome: { score: 40, errors: [] },
            prescription: { score: 20, errors: [] }
          },
          overallErrors: []
        };

        const result: DiagnosisResult = {
          caseId: 'case-001',
          patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
          diagnosis: {
            tongue: {},
            pulse: {},
            symptoms: [],
            syndrome: [],
            prescription: []
          }
        };

        const prompt = formatScoreForNPC(mockScoreResult, '李秀梅', result);
        expect(prompt).toContain(expectedLevel);
      };

      testScoreLevel(95, '优秀');
      testScoreLevel(80, '良好');
      testScoreLevel(65, '合格');
      testScoreLevel(50, '需加强');
    });
  });

  describe('Edge Cases', () => {
    test('should handle case with multiple correct prescriptions', () => {
      // case-001 has two correct prescriptions: f1 (藿香正气散) and f2 (平胃散)
      const partialPrescriptionResult: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' },
          pulse: { position: '关', quality: '濡缓' },
          symptoms: [],
          syndrome: ['b1'],
          prescription: ['f1'] // Only one correct prescription selected
        }
      };

      const score = calculateDiagnosisScore(partialPrescriptionResult, testCase);
      expect(score.breakdown.prescription.score).toBe(10); // Partial score
      expect(score.breakdown.prescription.errors.length).toBeGreaterThan(0);
      expect(score.totalScore).toBe(90);
    });

    test('should handle wrong syndrome with correct prescription', () => {
      const result: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' },
          pulse: { position: '关', quality: '濡缓' },
          symptoms: [],
          syndrome: ['b2'], // Wrong syndrome
          prescription: ['f1', 'f2'] // Correct prescriptions
        }
      };

      const score = calculateDiagnosisScore(result, testCase);
      expect(score.breakdown.syndrome.score).toBe(0);
      expect(score.breakdown.prescription.score).toBe(20);
      expect(score.totalScore).toBe(60);
    });

    test('should handle selecting wrong options alongside correct ones', () => {
      const result: DiagnosisResult = {
        caseId: 'case-001',
        patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
        diagnosis: {
          tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' },
          pulse: { position: '关', quality: '濡缓' },
          symptoms: [],
          syndrome: ['b1', 'b2'], // Correct + Wrong
          prescription: ['f1', 'f3'] // Correct + Wrong
        }
      };

      const score = calculateDiagnosisScore(result, testCase);
      expect(score.breakdown.syndrome.score).toBe(10); // Only b1 gives 10 points
      expect(score.breakdown.syndrome.errors).toContain('错误选择\'脾胃湿热\'证型');
      expect(score.breakdown.prescription.score).toBe(10); // Only f1 gives 10 points
      expect(score.breakdown.prescription.errors).toContain('不应选\'六君子汤\'');
      expect(score.totalScore).toBe(60);
    });
  });
});
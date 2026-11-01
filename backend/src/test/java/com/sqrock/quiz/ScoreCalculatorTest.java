package com.sqrock.quiz;

import com.sqrock.quiz.service.ScoreCalculator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScoreCalculatorTest {

    @Test
    void percentageIsCorrectDividedByTotalTimes100() {
        assertEquals(new BigDecimal("50.00"), ScoreCalculator.percentage(5, 10));
        assertEquals(new BigDecimal("33.33"), ScoreCalculator.percentage(1, 3));
        assertEquals(new BigDecimal("100.00"), ScoreCalculator.percentage(8, 8));
        assertEquals(new BigDecimal("0.00"), ScoreCalculator.percentage(0, 8));
    }

    @Test
    void zeroQuestionsGivesZeroPercentWithoutDividingByZero() {
        assertEquals(new BigDecimal("0.00"), ScoreCalculator.percentage(0, 0));
    }

    @Test
    void performanceMessageDependsOnPercentage() {
        assertTrue(ScoreCalculator.performanceMessage(new BigDecimal("95")).startsWith("Outstanding"));
        assertTrue(ScoreCalculator.performanceMessage(new BigDecimal("80")).startsWith("Excellent"));
        assertTrue(ScoreCalculator.performanceMessage(new BigDecimal("65")).startsWith("Good"));
        assertTrue(ScoreCalculator.performanceMessage(new BigDecimal("45")).startsWith("Fair"));
        assertTrue(ScoreCalculator.performanceMessage(new BigDecimal("10")).startsWith("Keep practicing"));
    }
}

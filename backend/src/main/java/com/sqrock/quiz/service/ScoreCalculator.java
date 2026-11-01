package com.sqrock.quiz.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Pure scoring rules (easy to unit test): 1 mark per correct answer, no negative marking. */
public final class ScoreCalculator {
    private ScoreCalculator() {}

    public static BigDecimal percentage(int correct, int total) {
        if (total <= 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return BigDecimal.valueOf(correct).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    public static String performanceMessage(BigDecimal percentage) {
        double p = percentage.doubleValue();
        if (p >= 90) return "Outstanding! You have mastered this topic.";
        if (p >= 75) return "Excellent work! You have a strong understanding.";
        if (p >= 60) return "Good job! A little more practice will make you even better.";
        if (p >= 40) return "Fair attempt. Review the explanations and try again.";
        return "Keep practicing. Review the answers and retake the quiz.";
    }
}

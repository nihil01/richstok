package com.richstok.warehouse.order;


import java.text.Normalizer;
import java.util.Locale;

public enum FulfillmentCity {
    BAKI,
    GANCA;

    public static FulfillmentCity fromInput(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = normalize(value);
        return switch (normalized) {
            case "baki", "baku" -> BAKI;
            case "ganca", "ganja", "gence" -> GANCA;
            default -> null;
        };
    }

    private static String normalize(String value) {
        String normalized = value
                .toLowerCase(Locale.ROOT)
                .replace("ə", "e")
                .replace("ı", "i")
                .replace("ö", "o")
                .replace("ü", "u")
                .replace("ç", "c")
                .replace("ş", "s")
                .replace("ğ", "g");

        return Normalizer.normalize(normalized, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^\\p{Alnum}]+", "");
    }
}

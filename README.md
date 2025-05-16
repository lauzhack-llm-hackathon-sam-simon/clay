# cray

```
atlas vectorSearch createIndex ChatSemanticIndex \
  --collection messages \
  --db chat_data \
  --type vector \
  --path embedding \
  --dimensions 768 \
  --similarity cosine
```

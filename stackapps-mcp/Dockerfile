FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
COPY stackapps_mcp ./stackapps_mcp

RUN pip install --no-cache-dir uv \
 && uv sync --frozen --no-dev

ENV PORT=8080
EXPOSE 8080

CMD ["uv", "run", "python", "-m", "stackapps_mcp.http_main"]

# Runtime stage: Node.js 26
FROM node:26-alpine
WORKDIR /workspace

COPY openapi ./openapi
COPY frontend ./frontend

WORKDIR /workspace/frontend
ENV PORT=3000
ENV BACKEND_URL=http://backend:8080

EXPOSE 3000
CMD ["node", "server.js"]

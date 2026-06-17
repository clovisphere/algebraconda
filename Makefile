# ---------------------------------------
# 🐍 Project: Algebraconda
# ---------------------------------------

PROJECT_NAME := algebraconda
PORT         ?= 3000
BUN_VERSION  ?= 1.2
IMAGE        := $(PROJECT_NAME)

# --------------------------------------------------------------------
# 🛠️ Shell Configuration
# --------------------------------------------------------------------
SHELL       := bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c

# Colors
CLR_GREEN  = \033[0;32m
CLR_YELLOW = \033[0;33m
CLR_TEAL   = \033[0;36m
CLR_RESET  = \033[0m

# --------------------------------------------------------------------
# ⚡ Phony Targets
# --------------------------------------------------------------------
.PHONY: help dev test \
        build run stop logs clean \
        c-feat c-fix c-chore c-refactor c-test \
        c-docs c-style c-perf c-ci c-build

# --------------------------------------------------------------------
# 📖 Help
# --------------------------------------------------------------------

## help: 📋 Display this help message
help:
	@printf "$(CLR_TEAL)🐍  Algebraconda — Slither · Solve · Survive$(CLR_RESET)\n"
	@printf "Usage: make <target>\n\n"
	@printf "Available targets:\n"
	@sed -n 's/^##//p' $(MAKEFILE_LIST) | while IFS=':' read -r target help; do \
		printf "  $(CLR_GREEN)%-18s$(CLR_RESET) %s\n" "$$target" "$$help"; \
	done
	@printf "\n"

# --------------------------------------------------------------------
# 🌿 Development
# --------------------------------------------------------------------

## dev: 🌿 Start the dev server on http://localhost:$(PORT)
dev:
	@printf "$(CLR_TEAL)→ 🌿 Starting dev server at http://localhost:$(PORT)...$(CLR_RESET)\n"
	@bun run dev

## test: 🧪 Run unit tests
test:
	@printf "$(CLR_TEAL)→ 🧪 Running tests...$(CLR_RESET)\n"
	@bun test
	@printf "$(CLR_GREEN)✅ All tests passed!$(CLR_RESET)\n"

# --------------------------------------------------------------------
# 🐳 Docker
# --------------------------------------------------------------------

## build: 🐳 Build the Docker image
build:
	@printf "$(CLR_TEAL)→ 🐳 Building $(IMAGE):latest (Bun $(BUN_VERSION))...$(CLR_RESET)\n"
	@docker build \
		--build-arg BUN_VERSION=$(BUN_VERSION) \
		-t $(IMAGE):latest .
	@printf "$(CLR_GREEN)✅ Image ready: $(IMAGE):latest$(CLR_RESET)\n"

## run: ⚓ Build and run the container (detached)
run: build
	@printf "$(CLR_TEAL)→ ⚓ Launching $(IMAGE) at http://localhost:$(PORT)...$(CLR_RESET)\n"
	@docker run -d -p $(PORT):$(PORT) --name $(PROJECT_NAME) $(IMAGE):latest
	@printf "$(CLR_GREEN)✅ Container running — open http://localhost:$(PORT)$(CLR_RESET)\n"

## stop: 🛑 Stop and remove the container
stop:
	@printf "$(CLR_TEAL)→ 🛑 Stopping $(PROJECT_NAME)...$(CLR_RESET)\n"
	@docker stop $(PROJECT_NAME) && docker rm $(PROJECT_NAME) 2>/dev/null || \
		printf "$(CLR_YELLOW)⚠️  No running container named $(PROJECT_NAME).$(CLR_RESET)\n"
	@printf "$(CLR_GREEN)✅ Stopped.$(CLR_RESET)\n"

## logs: 📋 Tail container logs
logs:
	@printf "$(CLR_TEAL)→ 📋 Tailing logs for $(PROJECT_NAME)...$(CLR_RESET)\n"
	@docker logs -f $(PROJECT_NAME)

## clean: 🧹 Remove the Docker image
clean:
	@printf "$(CLR_TEAL)→ 🧹 Removing image $(IMAGE):latest...$(CLR_RESET)\n"
	@docker rmi $(IMAGE):latest 2>/dev/null || \
		printf "$(CLR_YELLOW)⚠️  Image not found.$(CLR_RESET)\n"
	@printf "$(CLR_GREEN)✨ Clean complete!$(CLR_RESET)\n"

# --------------------------------------------------------------------
# 📝 Conventional Commits
# --------------------------------------------------------------------

define commit
	@read -p "Scope (optional, press enter to skip): " scope; \
	read -p "Subject: " subject; \
	if [ -n "$$scope" ]; then \
		git commit -m "$(1)($$scope): $$subject"; \
	else \
		git commit -m "$(1): $$subject"; \
	fi
endef

## c-feat: ✨ Commit — feat
c-feat:
	$(call commit,feat)

## c-fix: 🐛 Commit — fix
c-fix:
	$(call commit,fix)

## c-chore: 🔧 Commit — chore
c-chore:
	$(call commit,chore)

## c-refactor: ♻️  Commit — refactor
c-refactor:
	$(call commit,refactor)

## c-test: 🧪 Commit — test
c-test:
	$(call commit,test)

## c-docs: 📚 Commit — docs
c-docs:
	$(call commit,docs)

## c-style: 🎨 Commit — style
c-style:
	$(call commit,style)

## c-perf: ⚡ Commit — perf
c-perf:
	$(call commit,perf)

## c-ci: 🤖 Commit — ci
c-ci:
	$(call commit,ci)

## c-build: 📦 Commit — build
c-build:
	$(call commit,build)

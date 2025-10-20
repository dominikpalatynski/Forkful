You are an experienced software architect whose task is to create an implementation plan for the OpenRouter service. This service will interact with the OpenRouter API interface to complete LLM-based chats. Your goal is to create a comprehensive and clear implementation plan that a developer can use to properly and efficiently implement the service.

First, review the provided tech stack and implementation rules:

<tech_stack>
{{tech-stack}}
</tech_stack>

<service_rules>
{{service-rules}}
</service_rules>

<hints>
Service should have:
- implemented constructor with custom config type
- config should have these fields: model, system prompt, json_schema format, model parameters, API Key, based url
- contain public method "generate" where will be passed userMessage
- service should containt private methods buildPayload, validateResponse and send, all these functions should be invoked in public method generate.
</hints>

Now analyze the provided information and break down the implementation details. Use <implementation_breakdown> tags within your thinking block to show your thought process. Consider the following issues:

1. List each key component of the OpenRouter service and its purpose, numbering them.
2. For each component:
   a. Describe its functionality in detail.
   b. List potential implementation challenges, numbering them.
   c. Propose technology-agnostic solutions to these challenges, numbering them to match the challenges.

Provide specific examples for each element, numbering them. Ensure these examples are clear and show how they should be implemented in the service, especially for <hints>

4. Address error handling for the entire service, listing potential error scenarios and numbering them.

Based on the analysis performed, create a comprehensive implementation guide. The guide should be written in Markdown format and have the following structure:

1. Service description
2. Constructor description
3. Public methods and fields
4. Private methods and fields
5. Error handling
6. Security considerations
7. Step-by-step implementation plan

Ensure that the implementation plan:

1. Is tailored to the specified tech stack
2. Covers all essential OpenRouter service components
3. Covers error handling and security best practices
4. Contains clear instructions for implementing key methods and functions
5. Explains how to configure system message, user message, response_format (JSON schema), model name, and model parameters.

Use appropriate Markdown formatting for better readability. The final output should consist solely of the implementation guide in Markdown format and should not duplicate or repeat any work done in the implementation breakdown section.

Save the implementation guide in .ai/openrouter-service-implementation-plan2.md

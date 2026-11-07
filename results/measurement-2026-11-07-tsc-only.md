# Measurement 2026-11-07: tsc only

First measurement, before any rule of the harness exists. The only stage is tsc with the options in `cells/tsconfig.json`. A `gap` cell that passes is expected today: it marks what the harness's own rules must add.

| Cell | Rule | Kind | Result | Verdict | Message |
| --- | --- | --- | --- | --- | --- |
| `bypass_ts_expect_error` | BYPASS | gap | passes | ok |  |
| `bypass_ts_ignore` | BYPASS | gap | passes | ok |  |
| `bypass_ts_nocheck` | BYPASS | gap | passes | ok |  |
| `class_declaration` | CLASS | gap | passes | ok |  |
| `class_parameter_property` | CLASS | violation | stops | ok | TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled. |
| `context_mutable_param_not_written` | CONTEXT | gap | passes | ok |  |
| `context_mutable_param_written` | CONTEXT | control | passes | ok |  |
| `context_readonly_is_shallow` | CONTEXT | gap | passes | ok |  |
| `context_readonly_param` | CONTEXT | control | passes | ok |  |
| `context_write_through_readonly` | CONTEXT | violation | stops | ok | TS2339: Property 'push' does not exist on type 'readonly number[]'. |
| `control_engine_step` | TSC | control | passes | ok |  |
| `error_promise_reject` | ERROR | gap | passes | ok |  |
| `error_result_value` | ERROR | control | passes | ok |  |
| `error_throw` | ERROR | gap | passes | ok |  |
| `hidden_as_assertion` | HIDDEN | gap | passes | ok |  |
| `hidden_as_const` | HIDDEN | control | passes | ok |  |
| `hidden_explicit_any` | HIDDEN | gap | passes | ok |  |
| `hidden_implicit_any` | HIDDEN | violation | stops | ok | TS7006: Parameter 'value' implicitly has an 'any' type. |
| `hidden_non_null` | HIDDEN | gap | passes | ok |  |
| `hidden_unchecked_index` | HIDDEN | violation | stops | ok | TS2322: Type 'number \| undefined' is not assignable to type 'number'.   Type 'undefined'  |
| `import_dynamic_path` | IMPORT | gap | passes | ok |  |
| `import_eval` | IMPORT | gap | passes | ok |  |
| `import_new_function` | IMPORT | gap | passes | ok |  |
| `import_require` | IMPORT | violation | stops | ok | TS2591: Cannot find name 'require'. Do you need to install type definitions for node? Try  |
| `import_top_level_call` | IMPORT | gap | passes | ok |  |
| `lambda_mutates_capture_by_method` | LAMBDA | gap | passes | ok |  |
| `lambda_reads_capture` | LAMBDA | control | passes | ok |  |
| `lambda_writes_capture` | LAMBDA | gap | passes | ok |  |
| `name_parameter_as_function` | NAME | gap | passes | ok |  |
| `name_shadow` | NAME | gap | passes | ok |  |
| `name_sibling_blocks` | NAME | control | passes | ok |  |
| `release_with_using` | RELEASE | control | passes | ok |  |
| `release_without_using` | RELEASE | gap | passes | ok |  |
| `size_eight_parameters` | SIZE | gap | passes | ok |  |
| `size_seven_parameters` | SIZE | control | passes | ok |  |
| `state_exported_let` | STATE | gap | passes | ok |  |
| `state_exported_mutable_object` | STATE | gap | passes | ok |  |
| `state_private_module_let` | STATE | control | passes | ok |  |
| `surface_export_default` | SURFACE | gap | passes | ok |  |
| `surface_inferred_export` | SURFACE | violation | stops | ok | TS9010: Variable must have an explicit type annotation with --isolatedDeclarations. |
| `surface_missing_return_type` | SURFACE | violation | stops | ok | TS9007: Function must have an explicit return type annotation with --isolatedDeclarations. |
| `tsc_enum` | TSC | violation | stops | ok | TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled. |
| `tsc_namespace` | TSC | violation | stops | ok | TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled. |
| `world_clock_capability` | WORLD | control | passes | ok |  |
| `world_console_log` | WORLD | violation | stops | ok | TS2584: Cannot find name 'console'. Do you need to change your target library? Try changin |
| `world_date_now` | WORLD | gap | passes | ok |  |
| `world_fetch` | WORLD | violation | stops | ok | TS2304: Cannot find name 'fetch'. |
| `world_global_this_date` | WORLD | gap | passes | ok |  |
| `world_math_random` | WORLD | gap | passes | ok |  |
| `world_node_import` | WORLD | violation | stops | ok | TS2591: Cannot find name 'node:fs'. Do you need to install type definitions for node? Try  |
| `world_process_env` | WORLD | violation | stops | ok | TS2591: Cannot find name 'process'. Do you need to install type definitions for node? Try  |
| `world_set_timeout` | WORLD | violation | stops | ok | TS2304: Cannot find name 'setTimeout'. |

TypeScript 6.0.3, Node v24.16.0. Cells: 52. Stopped: 14. Wrong verdicts: 0.

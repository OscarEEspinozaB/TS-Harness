| Cell | Rule | Kind | Result | Verdict | Message |
| --- | --- | --- | --- | --- | --- |
| `allow_in_string` | ALLOW | control | passes | ok |  |
| `allow_malformed` | ALLOW | violation | stops | ok | ALLOW: malformed exception: write '// harness-allow RULE: reason', with a known rule and a |
| `allow_unknown_rule` | ALLOW | violation | stops | ok | ALLOW: malformed exception: write '// harness-allow RULE: reason', with a known rule and a |
| `allow_unused` | ALLOW | violation | stops | ok | ALLOW: exception for HIDDEN silences nothing: remove it |
| `bypass_ts_expect_error` | BYPASS | violation | stops | ok | BYPASS: @ts-expect-error switches a compiler check off |
| `bypass_ts_ignore` | BYPASS | violation | stops | ok | BYPASS: @ts-ignore switches a compiler check off |
| `bypass_ts_nocheck` | BYPASS | violation | stops | ok | BYPASS: @ts-nocheck switches a compiler check off |
| `class_declaration` | CLASS | violation | stops | ok | CLASS: class declaration: use readonly types and module functions |
| `class_parameter_property` | CLASS | violation | stops | ok | TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled. |
| `context_mutable_param_not_written` | CONTEXT | violation | stops | ok | CONTEXT: 'values' has a mutable type but is never written: declare it readonly |
| `context_mutable_param_written` | CONTEXT | control | passes | ok |  |
| `context_param_escapes` | CONTEXT | control | passes | ok |  |
| `context_param_method_write` | CONTEXT | control | passes | ok |  |
| `context_readonly_is_shallow` | CONTEXT | gap | passes | ok |  |
| `context_readonly_param` | CONTEXT | control | passes | ok |  |
| `context_write_through_readonly` | CONTEXT | violation | stops | ok | TS2339: Property 'push' does not exist on type 'readonly number[]'. |
| `control_engine_step` | TSC | control | passes | ok |  |
| `error_promise_reject` | ERROR | violation | stops | ok | ERROR: Promise.reject outside an entry point: return the failure as a value |
| `error_result_value` | ERROR | control | passes | ok |  |
| `error_throw` | ERROR | violation | stops | ok | ERROR: throw outside an entry point: return the failure as a value |
| `error_throw_in_main_entry` | ERROR | control | passes | ok |  |
| `header_missing` | HEADER | violation | stops | ok | HEADER: module without a header comment saying what it is for |
| `header_present` | HEADER | control | passes | ok |  |
| `hidden_as_allowed` | HIDDEN | control | passes | ok |  |
| `hidden_as_assertion` | HIDDEN | violation | stops | ok | HIDDEN: type assertion 'as': check the value instead |
| `hidden_as_const` | HIDDEN | control | passes | ok |  |
| `hidden_explicit_any` | HIDDEN | violation | stops | ok | HIDDEN: explicit any: name the type, or use unknown and check it |
| `hidden_implicit_any` | HIDDEN | violation | stops | ok | TS7006: Parameter 'value' implicitly has an 'any' type. |
| `hidden_non_null` | HIDDEN | violation | stops | ok | HIDDEN: non-null assertion '!': check for undefined instead |
| `hidden_unchecked_index` | HIDDEN | violation | stops | ok | TS2322: Type 'number \| undefined' is not assignable to type 'number'.   Type 'undefined'  |
| `import_dynamic_path` | IMPORT | violation | stops | ok | IMPORT: dynamic import with a path that is not a literal |
| `import_eval` | IMPORT | violation | stops | ok | IMPORT: eval: code that is not visible to the compiler |
| `import_new_function` | IMPORT | violation | stops | ok | IMPORT: new Function: code that is not visible to the compiler |
| `import_require` | IMPORT | violation | stops | ok | TS2591: Cannot find name 'require'. Do you need to install type definitions for node? Try  |
| `import_top_level_call` | IMPORT | control | passes | ok |  |
| `import_top_level_statement` | IMPORT | violation | stops | ok | IMPORT: top-level statement runs on import |
| `lambda_mutates_capture_by_method` | LAMBDA | gap | passes | ok |  |
| `lambda_reads_capture` | LAMBDA | control | passes | ok |  |
| `lambda_writes_capture` | LAMBDA | violation | stops | ok | LAMBDA: the lambda writes 'total', which it captured: return the value instead |
| `lambda_writes_own_variable` | LAMBDA | control | passes | ok |  |
| `name_parameter_as_function` | NAME | violation | stops | ok | NAME: a parameter is named like its function 'f' |
| `name_shadow` | NAME | violation | stops | ok | NAME: 'scale' shadows a binding of an enclosing scope |
| `name_sibling_blocks` | NAME | control | passes | ok |  |
| `release_with_using` | RELEASE | control | passes | ok |  |
| `release_without_using` | RELEASE | violation | stops | ok | RELEASE: a Disposable held without using: declare it with using |
| `size_eight_parameters` | SIZE | violation | stops | ok | SIZE: 8 parameters: more than 7 |
| `size_seven_parameters` | SIZE | control | passes | ok |  |
| `state_exported_let` | STATE | violation | stops | ok | STATE: exported mutable binding: export a const |
| `state_exported_mutable_object` | STATE | violation | stops | ok | STATE: exported mutable value: give it a readonly type |
| `state_exported_readonly_map` | STATE | control | passes | ok |  |
| `state_exported_readonly_object` | STATE | control | passes | ok |  |
| `state_private_module_let` | STATE | control | passes | ok |  |
| `surface_export_default` | SURFACE | violation | stops | ok | SURFACE: export default: export by name |
| `surface_inferred_export` | SURFACE | violation | stops | ok | TS9010: Variable must have an explicit type annotation with --isolatedDeclarations. |
| `surface_missing_return_type` | SURFACE | violation | stops | ok | TS9007: Function must have an explicit return type annotation with --isolatedDeclarations. |
| `tsc_enum` | TSC | violation | stops | ok | TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled. |
| `tsc_namespace` | TSC | violation | stops | ok | TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled. |
| `world_clock_capability` | WORLD | control | passes | ok |  |
| `world_console_log` | WORLD | violation | stops | ok | TS2584: Cannot find name 'console'. Do you need to change your target library? Try changin |
| `world_date_in_main_entry` | WORLD | control | passes | ok |  |
| `world_date_now` | WORLD | violation | stops | ok | WORLD: 'Date' reaches outside the program: receive it from main as a capability |
| `world_entry_without_main_entry` | WORLD | violation | stops | ok | WORLD: entry point without a function main |
| `world_fetch` | WORLD | violation | stops | ok | TS2304: Cannot find name 'fetch'. |
| `world_global_this_date` | WORLD | violation | stops | ok | WORLD: 'globalThis' reaches outside the program: receive it from main as a capability |
| `world_local_named_like_global` | WORLD | control | passes | ok |  |
| `world_math_random` | WORLD | violation | stops | ok | WORLD: 'Math.random' reaches outside the program: receive a Random from main |
| `world_node_import` | WORLD | violation | stops | ok | TS2591: Cannot find name 'node:fs'. Do you need to install type definitions for node? Try  |
| `world_process_env` | WORLD | violation | stops | ok | TS2591: Cannot find name 'process'. Do you need to install type definitions for node? Try  |
| `world_set_timeout` | WORLD | violation | stops | ok | TS2304: Cannot find name 'setTimeout'. |

TypeScript 6.0.3, Node v24.16.0. Cells: 69. Stopped: 44. Wrong verdicts: 0.

| Fixture | Expected | Found | Verdict |
| --- | --- | --- | --- |
| `clean` | none | none | ok |
| `layers` | LAYER 2 | LAYER 2 | ok |
| `surface` | SURFACE 2 | SURFACE 2 | ok |
